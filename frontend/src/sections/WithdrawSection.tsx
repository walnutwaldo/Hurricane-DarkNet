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

export function WithdrawSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    const [generatingProof, setGeneratingProof] = useState(false);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const sRef = useRef<HTMLInputElement>(null);

    const [proof, setProof] = useState<{
        pi_a: [string, string],
        pi_b: [[string, string], [string, string]],
        pi_c: [string, string],
    } | undefined>(undefined);
    const [
        publicSignals,
        setPublicSignals
    ] = useState<string[] | undefined>(undefined);

    async function runProof(currentSecret: BigNumber) {
		console.log(contract.indexOfLeaf(mimc(currentSecret, "0")));
        const siblingsData = await contract.getPath(await contract.indexOfLeaf(mimc(currentSecret, "0")));
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());

        console.log(siblingsData);

        // console.log("siblings", siblingsData);
        // console.log("dir", dir);
        const input = {
            mimcK: "0",
            receiver: await signer!.getAddress(),
            secret: currentSecret.toString(),
            others: others,
            dir: dir,
        }
        const {
            proof,
            publicSignals
        } = await groth16.fullProve(input, "circuit/withdrawer_big.wasm", "circuit/withdrawer_big.zkey");
        setProof(proof);
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
		console.log(await contract.merkleRoot());
        const tx = await contract.withdraw(...withdrawArgs).catch((err: any) => {
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
                <input type="text" name="secretTextbox" ref={sRef}
                       className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
                <div className="flex flex-row gap-2">
                    <PrimaryButton type="submit" onClick={() => {
                        setWithdrawErrMsg("");
                        let currentSecret = BigNumber.from("0");
                        try {
                            currentSecret = BigNumber.from(sRef.current!.value);
                        } catch (err) {
                            setWithdrawErrMsg("Use an actual number for the secret!");
                            return;
                        }
                        if (currentSecret.gte(BigNumber.from("2").pow(BigNumber.from("256")))) {
                            setWithdrawErrMsg("Secret out of bounds");
                            return;
                        }
                        setGeneratingProof(true);
                        runProof(currentSecret).then(() => {
                            setGeneratingProof(false);
                        })
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
                                            <span>Withdrawing <InlineLoader/></span> : "Withdraw 0.1 ETH"
                                    }
                                </PrimaryButton>
                                {isPreparingTxn && (
                                    <span>
                                                Preparing transaction <InlineLoader/>
                                            </span>
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
