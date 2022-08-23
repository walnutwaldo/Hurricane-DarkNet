import React, {useContext, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "../contracts/deployInfo";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function DepositSection() {
    const {secret, setSecret, addDeposit} = useContext(SecretContext);
    const [generatingProof, setGeneratingProof] = useState(false);
    const { chain, chains } = useNetwork()

    const contractAddress = HURRICANE_CONTRACT_ADDRESS[chain!.name.toLowerCase()];

    console.log("chain name", chain?.name);

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

    const numLeavesData = useContractRead({
        addressOrName: contractAddress,
        contractInterface: HURRICANE_CONTRACT_ABI,
        functionName: 'numLeaves',
    });
    const numLeaves = numLeavesData.data;

    async function runProof() {
        const siblingsData = await contract.getPath(numLeaves);
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        // console.log("siblings", siblingsData);
        // console.log("dir", dir);
        const input = {
            secret: secret!.toString(),
            mimcK: "0",
            others: others,
            dir: dir,
        }
        const {
            proof,
            publicSignals
        } = await groth16.fullProve(input, "circuit/depositor_big.wasm", "circuit/depositor_big.zkey");
        setProof(proof);
        setPublicSignals(publicSignals);
        console.log("proof", JSON.stringify(proof, null, '\t'));
        console.log("publicSignals", JSON.stringify(publicSignals, null, '\t'));
    }

    const depositArgs = (proof && publicSignals) ? [
        [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])],
        [
            [BigNumber.from(proof.pi_b[0][1]), BigNumber.from(proof.pi_b[0][0])],
            [BigNumber.from(proof.pi_b[1][1]), BigNumber.from(proof.pi_b[1][0])]
        ],
        [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])],
        publicSignals.map((s) => BigNumber.from(s)),
    ] : [];

    const [isDepositing, setIsDepositing] = useState(false);

    async function makeDeposit() {
        setIsDepositing(true);
        console.log("depositArgs", depositArgs);
        const tx = await contract.deposit(...depositArgs, {
            value: ethers.utils.parseEther('1')
        });
        console.log("tx", tx);
        const result = await tx.wait();
        setIsDepositing(false);
        if (result.status) {
            addDeposit?.({
                secret: secret!,
                leaf: BigNumber.from(publicSignals![1])
            });
            setSecret?.(undefined);
        }
    }

    return (
        <div className={"mb-3"}>
            <h3 className={"text-lg text-black font-bold"}>
                DEPOSIT
            </h3>
            {
                secret ? (
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
                                        makeDeposit();
                                    }} disabled={isDepositing}>
                                        Deposit 1 ETH
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
                        First generate a secret before starting a deposit.
                    </span>
                )
            }
        </div>
    )
}