import React, {useContext, useEffect, useRef, useState} from "react";
import SecretContext, {privateKeyToSecret, Secret, unmaskTokenData} from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {
    HURRICANE_CONTRACT_ABI,
    HURRICANE_CONTRACT_ADDRESSES, NFT_ABI,
    NFT_ADDRESS_HARDCODED,
    NFT_ID_HARDCODED
} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";
import {useNftFromSecret} from "../utils/useNftFromSecret";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function WithdrawSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const [generatingProof, setGeneratingProof] = useState(false);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const sRef = useRef<HTMLInputElement>(null);
    const [currentSecret, setCurrentSecret] = useState<any>(undefined);

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
        }
    ) {
        const leafIdx = await contract.leafForPubkey(mimc(secret.secret, "0"));
        const siblingsData = await contract.getPath(leafIdx);
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        const rootIdx = siblingsData.rootIdx;

        const input = {
            mimcK: "0",
            tokenAddress: NFT_ADDRESS_HARDCODED,
            tokenId: NFT_ID_HARDCODED,
            withdrawer: await signer!.getAddress(),
            secret: secret.secret.toString(),
            secretNoise: secret.noise.toString(),
            others: others,
            dir: dir,
        }
        const {
            proof,
            publicSignals
        } = await groth16.fullProve(input, "circuit/withdraw.wasm", "circuit/withdraw.zkey");

        const merkleRoot = publicSignals[0];

        console.log({
            leafIdx,
            others,
            dir,
            rootIdx,
            merkleRoot
        });

        setProof(proof);
        setRootIdx(rootIdx);
        setPublicSignals(publicSignals);
        console.log("publicSignals", publicSignals);
    }

    const withdrawArgs = (proof && publicSignals) ? [
        [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])],
        [
            [BigNumber.from(proof.pi_b[0][1]), BigNumber.from(proof.pi_b[0][0])],
            [BigNumber.from(proof.pi_b[1][1]), BigNumber.from(proof.pi_b[1][0])]
        ],
        [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])],
        publicSignals.map((s) => BigNumber.from(s)),
    ] : [];

    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawErrMsg, setWithdrawErrMsg] = useState("");
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);

    async function makeWithdrawal() {
        setIsWithdrawing(true);

        setIsPreparingTxn(true);
        const tx = await contract.withdraw(
            ...withdrawArgs,
            rootIdx,
        ).catch((err: any) => {
            console.log(err);
            setWithdrawErrMsg("Withdraw failed (possibly secret already taken)");
            setIsWithdrawing(false);
            setIsPreparingTxn(false);
        });
        setIsPreparingTxn(false);
        const result = await tx.wait();
        setIsWithdrawing(false);
        setProof(undefined);
    }

    return (
        <div className={"mb-3"}>
            <h3 className={"text-lg text-black font-bold"}>
                WITHDRAW
            </h3>
            <div>
                <label>Secret:</label>
                <input
                    type="text"
                    name="secretTextbox"
                    ref={sRef}
                    className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}
                    onChange={updateSecret}
                /><br/>
                <div className="flex flex-row gap-2">
                    <PrimaryButton type="submit" onClick={() => {
                        if (!currentSecret) {
                            setWithdrawErrMsg("Please enter a secret");
                        } else {
                            setWithdrawErrMsg("");
                            setGeneratingProof(true);
                            runProof(currentSecret).then(() => {
                                setGeneratingProof(false);
                            })
                        }
                    }} disabled={generatingProof}>
                        Generate Proof
                    </PrimaryButton>
                    {proof &&
                        (<>
                                <PrimaryButton onClick={() => {
                                    makeWithdrawal();
                                }} disabled={isWithdrawing}>
                                    {
                                        isWithdrawing ?
                                            <span>Withdrawing <InlineLoader/></span> : `Withdraw ${nftInfo?.name || "unknown"}`
                                    }
                                </PrimaryButton>
                                {isWithdrawing && (
                                    isPreparingTxn ? (
                                        <span>
                                            Preparing transaction <InlineLoader/>
                                        </span>
                                    ) : (
                                        <span>
                                            Withdrawing <InlineLoader/>
                                        </span>
                                    )
                                )}
                            </>
                        )
                    }
                </div>
                <div className={"text-red-500"}>{withdrawErrMsg}</div>
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
