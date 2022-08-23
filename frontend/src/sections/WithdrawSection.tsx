import React, {useContext, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "../contracts/deployInfo";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function WithdrawSection() {
    const {deposits, removeDeposit} = useContext(SecretContext);

    const { chain, chains } = useNetwork()

    const contractAddress = HURRICANE_CONTRACT_ADDRESS[chain!.name.toLowerCase()];

    const deposit = deposits.length > 0 ? deposits[0] : undefined;

    const [generatingProof, setGeneratingProof] = useState(false);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const [proof, setProof] = useState<{
        pi_a: [string, string],
        pi_b: [[string, string], [string, string]],
        pi_c: [string, string],
    } | undefined>(undefined);
    const [
        publicSignals,
        setPublicSignals
    ] = useState<string[] | undefined>(undefined);

    async function runProof() {
        const siblingsData = await contract.getPath(await contract.indexOfLeaf(deposit!.leaf));
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        // console.log("siblings", siblingsData);
        // console.log("dir", dir);
        const input = {
            mimcK: "0",
            secret: deposit!.secret.toString(),
            others: others,
            dir: dir,
        }
        const {
            proof,
            publicSignals
        } = await groth16.fullProve(input, "circuit/withdrawer_big.wasm", "circuit/withdrawer_big.zkey");
        setProof(proof);
        setPublicSignals(publicSignals);
        // console.log("publicSignals", publicSignals);
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

    async function makeWithdrawal() {
        setIsWithdrawing(true);
        const tx = await contract.withdraw(...withdrawArgs);
        console.log("tx", tx);
        const result = await tx.wait();
        setIsWithdrawing(false);
        if (result.status) {
            removeDeposit!(0);
        }
    }

    return (
        <div className={"mb-3"}>
            <h3 className={"text-lg text-black font-bold"}>
                WITHDRAW
            </h3>

            {
                deposit ? (
                    <div>
                        <div className="flex flex-row gap-2">
                            <PrimaryButton onClick={() => {
                                setGeneratingProof(true);
                                runProof().then(() => {
                                    setGeneratingProof(false);
                                })
                            }} disabled={generatingProof}>
                                Generate Proof
                            </PrimaryButton>
                            {proof && (
                                (
                                    <PrimaryButton onClick={() => {
                                        makeWithdrawal();
                                    }} disabled={isWithdrawing}>
                                        Withdraw 1 ETH
                                    </PrimaryButton>
                                )
                            )}
                        </div>

                        <div>
                            {
                                generatingProof ? (
                                    <span>Generating Proof ...</span>
                                ) : (
                                    <div>
                                        {
                                            proof && (<>
                                                Proof
                                                <div
                                                    className={"p-2 rounded-md font-mono text-sm bg-gray-300 h-72 overflow-y-scroll whitespace-pre-wrap"}
                                                >
                                                    {JSON.stringify(proof, null, 2)}
                                                </div>
                                            </>)
                                        }
                                    </div>
                                )
                            }
                        </div>
                    </div>

                ) : (
                    <span>
                        No deposits to withdraw.
                    </span>
                )
            }
        </div>
    )
}