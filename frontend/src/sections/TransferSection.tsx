import React, {useContext, useRef, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function TransferSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    const [generatingProof, setGeneratingProof] = useState(false);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const sRef = useRef<HTMLInputElement>(null);
    const shRef = useRef<HTMLInputElement>(null);

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

    async function runProof(currentSecret: BigNumber, receiverShared: BigNumber) {
        const siblingsData = await contract.getPath(await contract.indexOfLeaf(mimc(currentSecret, "0", 91)));
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        const rootIdx = siblingsData.rootIdx;

        console.log(siblingsData);

        // console.log("siblings", siblingsData);
        // console.log("dir", dir);
        const input = {
            mimcK: "0",
            receiver: receiverShared.toString(),
            secret: currentSecret.toString(),
            others: others,
            dir: dir,
        }
        const {
            proof,
            publicSignals
        } = await groth16.fullProve(input, "circuit/withdrawer_big.wasm", "circuit/withdrawer_big.zkey");
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

    async function makeTransfer(receiverShared: BigNumber) {
        setIsTransferring(true);
        setIsPreparingTxn(true);
        const tx = await contract.transfer(
            ...transferProofArgs,
            rootIdx,
            receiverShared
        ).catch((err: any) => {
            console.log(err);
            setTransferErrMsg("Transfer failed (possibly secret already taken)");
            setIsTransferring(false);
            setIsPreparingTxn(false);
        });
        setIsPreparingTxn(false);
        const result = await tx.wait();
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
                <input type="text" name="secretTextbox" ref={sRef}
                       className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>

                <label>Receiver's shared key:</label>
                <input type="text" name="sharedTextbox" ref={shRef}
                       className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
                
                <div className={"text-red-500"}>{transferErrMsg}</div>

                <div className="flex flex-row gap-2">
                    <PrimaryButton type="submit" onClick={() => {
                        setTransferErrMsg("");
                        let currentSecret = BigNumber.from("0");
                        try {
                            currentSecret = BigNumber.from(sRef.current!.value);
                        } catch (err) {
                            setTransferErrMsg("Use an actual number for the secret!");
                            return;
                        }
                        if (currentSecret.gte(BigNumber.from("2").pow(BigNumber.from("256")))) {
                            setTransferErrMsg("Secret out of bounds");
                            return;
                        }
                        setGeneratingProof(true);
                        let receiverShared = BigNumber.from("0");
                        try {
                            receiverShared = BigNumber.from(shRef.current!.value);
                        } catch (err) {
                            setTransferErrMsg("Use an actual number for the secret!");
                            return;
                        }
                        if (receiverShared.gte(BigNumber.from("2").pow(BigNumber.from("256")))) {
                            setTransferErrMsg("Secret out of bounds");
                            return;
                        }
                        runProof(currentSecret, receiverShared).then(() => {
                            setGeneratingProof(false);
                        })
                    }} disabled={generatingProof}>
                        Generate Proof
                    </PrimaryButton>
                    {proof &&
                        (<>
                                <PrimaryButton onClick={() => {
                                    let receiverShared = BigNumber.from("0");
                                    try {
                                        receiverShared = BigNumber.from(shRef.current!.value);
                                    } catch (err) {
                                        setTransferErrMsg("Use an actual number for the secret!");
                                        return;
                                    }
                                    if (receiverShared.gte(BigNumber.from("2").pow(BigNumber.from("256")))) {
                                        setTransferErrMsg("Secret out of bounds");
                                        return;
                                    }
                                    makeTransfer(receiverShared).then();
                                }} disabled={isTransferring}>
                                    {
                                        isTransferring ?
                                            <span>Transferring <InlineLoader/></span> : "Transfer 0.1 ETH"
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
