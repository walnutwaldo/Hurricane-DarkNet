import React, {useRef, useState} from "react";
import {maskTokenData, privateKeyToSecret, sharedKeyToSecret} from "../contexts/SecretContext";
import {useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {
    HURRICANE_CONTRACT_ABI,
    HURRICANE_CONTRACT_ADDRESSES,
    NFT_ADDRESS_HARDCODED,
    NFT_ID_HARDCODED
} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";
import {useNftFromSecret} from "../utils/useNftFromSecret";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function TransferSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const [generatingProof, setGeneratingProof] = useState(false);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const sRef = useRef<HTMLInputElement>(null);
    const shRef = useRef<HTMLInputElement>(null);

    const [currentSecret, setCurrentSecret] = useState<any>(undefined);
    const [receiverShared, setReceiverShared] = useState<any>(undefined);

    function updateSecret() {
        try {
            setCurrentSecret(
                sRef.current ? (
                    privateKeyToSecret(sRef.current!.value) || undefined
                ) : undefined
            );
        } catch {
            setCurrentSecret(undefined);
        }
    }

    function updateShared() {
        try {
            setReceiverShared(
                shRef.current ? (sharedKeyToSecret(shRef.current.value) || undefined) : undefined
            )
        } catch {
            setReceiverShared(undefined);
        }
    }

    const [nftContract, nftInfo] = useNftFromSecret(currentSecret);

    const [proof, setProof] = useState<{
        pi_a: [string, string],
        pi_b: [[string, string], [string, string]],
        pi_c: [string, string],
    } | undefined>(undefined);
    const [
        publicSignals,
        setPublicSignals
    ] = useState<string[] | undefined>(undefined);
    const [rootIdx, setRootIdx] = useState<BigNumber | undefined>(undefined);

    async function runProof(
        secret: {
            secret: BigNumber,
            noise: BigNumber
        },
        shared: {
            shared: BigNumber,
            noise: BigNumber
            tokenMask: BigNumber,
            tokenIdMask: BigNumber
        }
    ) {
        const leafIdx = await contract.leafForPubkey(mimc(secret.secret, "0", 91));
        const siblingsData = await contract.getPath(leafIdx);
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        const rootIdx = siblingsData.rootIdx;

        const input = {
            mimcK: "0",
            newPubKey: shared.shared.toString(),
            tokenAddress: NFT_ADDRESS_HARDCODED,
            tokenId: NFT_ID_HARDCODED,
            secret: secret.secret.toString(),
            secretNoise: secret.noise.toString(),
            newSecretNoise: shared.noise.toString(),
            others: others,
            dir: dir,
        }
        const {
            proof,
            publicSignals
        } = await groth16.fullProve(input, "circuit/transfer.wasm", "circuit/transfer.zkey");

        setProof(proof);
        setRootIdx(rootIdx);
        setPublicSignals(publicSignals);
        console.log("publicSignals", publicSignals);
    }

    const transferProofArgs = (proof && publicSignals) ? [
        [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])],
        [
            [BigNumber.from(proof.pi_b[0][1]), BigNumber.from(proof.pi_b[0][0])],
            [BigNumber.from(proof.pi_b[1][1]), BigNumber.from(proof.pi_b[1][0])]
        ],
        [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])],
        publicSignals.map((s) => BigNumber.from(s)),
    ] : [];

    const [isTransferring, setIsTransferring] = useState(false);
    const [transferErrMsg, setTransferErrMsg] = useState("");
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);

    async function makeTransfer(
        shared: {
            shared: BigNumber,
            noise: BigNumber
            tokenMask: BigNumber,
            tokenIdMask: BigNumber
        }
    ) {
        setIsTransferring(true);
        setIsPreparingTxn(true);
        const tx = await contract.transfer(
            ...transferProofArgs,
            rootIdx,
            maskTokenData(
                NFT_ADDRESS_HARDCODED,
                NFT_ID_HARDCODED,
                shared
            )
        ).catch((err: any) => {
            console.log(err);
            setTransferErrMsg("Transfer failed (possibly secret already taken)");
            setIsTransferring(false);
            setIsPreparingTxn(false);
        });
        setIsPreparingTxn(false);
        const result = await tx.wait();
        if (!result.status) {
            setTransferErrMsg("Transfer failed (possibly secret already taken)");
        }
        setIsTransferring(false);
        setProof(undefined);
    }

    return (
        <div className={"mb-3"}>
            <h3 className={"text-lg text-black font-bold"}>
                TRANSFER
            </h3>
            <div>
                <label>Your secret:</label>
                <input
                    type="text"
                    name="secretTextbox"
                    ref={sRef}
                    className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}
                    onChange={updateSecret}
                /><br/>

                <label>Receiver's shared key:</label>
                <input
                    type="text"
                    name="sharedTextbox"
                    ref={shRef}
                    className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}
                    onChange={updateShared}
                /><br/>

                <div className={"text-red-500"}>{transferErrMsg}</div>

                <div className="flex flex-row gap-2">
                    <PrimaryButton type="submit" onClick={() => {
                        if (!receiverShared) {
                            setTransferErrMsg("Please enter a secret");
                        } else if (!receiverShared) {
                            setTransferErrMsg("Please enter a shared key");
                        } else {
                            setTransferErrMsg("");
                            setGeneratingProof(true);
                            runProof(currentSecret, receiverShared).then(() => {
                                setGeneratingProof(false);
                            })
                        }
                    }} disabled={generatingProof}>
                        Generate Proof
                    </PrimaryButton>
                    {proof &&
                        (<>
                                <PrimaryButton onClick={() => {
                                    if (!receiverShared) {
                                        setTransferErrMsg("Please enter a shared key");
                                    } else {
                                        makeTransfer(receiverShared).then();
                                    }
                                }} disabled={isTransferring}>
                                    {
                                        isTransferring ?
                                            <span>Transferring <InlineLoader/></span> : `Transfer ${nftInfo.name || "unknown"}`
                                    }
                                </PrimaryButton>
                                {isTransferring && (isPreparingTxn ? (
                                    <span>
                                        Preparing transaction <InlineLoader/>
                                    </span>
                                ) : (
                                    <span>
                                        Transferring <InlineLoader/>
                                    </span>
                                ))}
                            </>
                        )
                    }
                </div>

                <div>
                    {
                        generatingProof ? (
                            <span>Generating Proof <InlineLoader/></span>
                        ) : (
                            <div>
                                {
                                    proof && (<>
                                        Proof
                                        <div
                                            className={"p-2 rounded-md font-mono text-sm bg-gray-300 h-72 overflow-y-scroll whitespace-pre-wrap"}>
                                            {JSON.stringify(proof, null, 2)}
                                        </div>
                                    </>)
                                }
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}
