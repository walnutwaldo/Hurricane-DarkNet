import React, {useContext, useRef, useState} from "react";
import SecretContext, {maskTokenData, sharedKeyToSecret} from "../contexts/SecretContext";
import {useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract} from "ethers";
import {PrimaryButton, SecondaryButton} from "../components/buttons";
import {
    HURRICANE_CONTRACT_ABI,
    HURRICANE_CONTRACT_ADDRESSES
} from "../contracts/deployInfo";
import {useNftFromSecret} from "../utils/useNftFromSecret";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function TransferSection(props: any) {
    const {idx, rm, setAssetSel, setErrMsg, setExportState} = props
    const {chain, chains} = useNetwork();
    const secretContext = useContext(SecretContext);
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const [generatingProof, setGeneratingProof] = useState(false);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const shRef = useRef<HTMLInputElement>(null);

    const currentSecret = secretContext.assets[idx];
    const [receiverShared, setReceiverShared] = useState<any>(undefined);

    const {nftContract, nftInfo, tokenAddress, tokenId} = useNftFromSecret(currentSecret);

    function updateShared() {
        try {
            setReceiverShared(
                shRef.current ? (sharedKeyToSecret(shRef.current.value) || undefined) : undefined
            )
        } catch {
            setReceiverShared(undefined);
        }
    }

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
        shared: {
            shared: BigNumber,
            noise: BigNumber
            tokenMask: BigNumber,
            tokenIdMask: BigNumber
        }
    ) {
        const leaf = mimc(currentSecret.secret, "0");
        const leafIdx = await contract.leafForPubkey(leaf);
        const siblingsData = await contract.getPath(leafIdx);
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        const rootIdx = siblingsData.rootIdx;

        const input = {
            mimcK: "0",
            newPubKey: shared.shared.toString(),
            tokenAddress: BigNumber.from(tokenAddress).toString(),
            tokenId: tokenId!.toString(),
            secret: currentSecret.secret.toString(),
            secretNoise: currentSecret.noise.toString(),
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

        const res = {
            proof,
            publicSignals,
            rootIdx
        }

        console.log("proofRes", res);

        return res;
    }

    const [expanded, setIsExpanded] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);

    async function makeTransfer(
        proofRes: any,
        shared: {
            shared: BigNumber,
            noise: BigNumber
            tokenMask: BigNumber,
            tokenIdMask: BigNumber
        }
    ) {
        setIsTransferring(true);
        setIsPreparingTxn(true);

        const {
            proof: currProof,
            publicSignals: currSignals,
            rootIdx: currRootIdx
        } = proofRes;
        const transferProofArgs = (currProof && currSignals) ? [
            [BigNumber.from(currProof.pi_a[0]), BigNumber.from(currProof.pi_a[1])],
            [
                [BigNumber.from(currProof.pi_b[0][1]), BigNumber.from(currProof.pi_b[0][0])],
                [BigNumber.from(currProof.pi_b[1][1]), BigNumber.from(currProof.pi_b[1][0])]
            ],
            [BigNumber.from(currProof.pi_c[0]), BigNumber.from(currProof.pi_c[1])],
            currSignals.map((s: string) => BigNumber.from(s)),
        ] : [];

        const tx = await contract.transfer(
            ...transferProofArgs,
            currRootIdx,
            maskTokenData(
                tokenAddress!,
                tokenId!,
                shared
            )
        ).catch((err: any) => {
            console.log(err);
            setErrMsg("Transfer failed (possibly secret already taken)");
            setIsTransferring(false);
            setExportState("Exporting");
            setIsPreparingTxn(false);
        });
        console.log("transfer pending");
        setIsPreparingTxn(false);
        const result = await tx.wait();
        if (!result?.status) {
            setErrMsg("Transfer failed (possibly secret already taken)");
        }
        setIsTransferring(false);
        setProof(undefined);
        setExportState("Exporting");
        if (result?.status) {
            console.log("transfer success");
            rm!(idx);
            setAssetSel!(-1);
        }
    }

    return (
        <div className={"flex flex-col gap-1 items-center"}>
            {
                !(isTransferring || generatingProof) && (
                    <>
                        {expanded && <div className="flex flex-row gap-2 w-full">
                            <input
                                type="text"
                                name="sharedTextbox"
                                placeholder={"Receiver's shared key"}
                                ref={shRef}
                                className={"flex-1 min-w-0 rounded-md text-black outline-none bg-slate-100 px-1 mb-1"}
                                onChange={updateShared}
                            />
                            <button
                                type="submit"
                                className={"outline-none bg-zinc-400 disabled:opacity-50 text-white rounded-md px-1 transition hover:scale-105"}
                                onClick={() => {
                                    setExportState("Exporting");
                                    setIsTransferring(false);
                                    setIsExpanded(false);
                                }}>
                                Cancel
                            </button>
                        </div>
                        }
                        <SecondaryButton
                            type="submit"
                            onClick={() => {
                                if (expanded && receiverShared) {
                                    setErrMsg("");
                                    setGeneratingProof(true);
                                    runProof(receiverShared).then((proofRes) => {
                                        setGeneratingProof(false);
                                        makeTransfer(proofRes, receiverShared).then(() => {
                                            setIsExpanded(false);
                                        });
                                    })
                                } else {
                                    setErrMsg("");
                                    setExportState("Transferring");
                                    setIsExpanded(true);
                                }
                            }}
                            disabled={expanded && (!nftInfo || !receiverShared)}
                            className={"w-full"}
                        >
                            Transfer
                        </SecondaryButton>
                    </>
                )
            }
            {
                expanded && generatingProof && <span>Generating Proof <InlineLoader/></span>
            }
            {
                expanded && isTransferring && <span>Transferring <InlineLoader/></span>
            }
        </div>
    )
}
