import React, {useContext, useState} from 'react';
import {
    useContract,
    useContractRead, useSigner,
} from "wagmi";
import {BigNumber} from "ethers";
import SecretContext from './contexts/SecretContext';
import {PrimaryButton, SecondaryButton} from "./components/buttons";
import HURRICANE_CONTRACT_ABI from "./contracts/hurricane_abi.json";

// @ts-ignore
const {groth16, zKey} = snarkjs;

const HURRICANE_CONTRACT_ADDRESS = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";

const MODULUS = BigNumber.from(2).pow(256).sub(BigNumber.from(2).pow(32)).sub(977);

function GenerateSecretSection() {
    const {secret, setSecret} = useContext(SecretContext);
    const [enableCopy, setEnableCopy] = useState(true);

    return (<div className={"mb-3"}>
        <h3 className={"text-lg text-black font-bold"}>
            GENERATE A SECRET
        </h3>
        <div className={"flex flex-row gap-2"}>
            <PrimaryButton onClick={() => {
                const randomBytes = crypto.getRandomValues(new Uint32Array(10));
                // Concatenate into hex string
                const secretString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
                const secret = BigNumber.from("0x" + secretString).mod(MODULUS);
                setSecret!(secret);
            }}>
                Generate
            </PrimaryButton>
            {
                (secret !== undefined) && (
                    <>
                        <SecondaryButton onClick={() => {
                            // Copy secret.toHexString() to clipboard
                            navigator.clipboard.writeText(secret.toHexString());
                            setEnableCopy(false);
                            setTimeout(() => {
                                setEnableCopy(true);
                            }, 1000);
                        }} disabled={!enableCopy}>
                            {enableCopy ? "Copy" : "Copied!"}
                        </SecondaryButton>
                        <span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                                {secret.toHexString()}
                            </span>
                    </>
                )
            }
        </div>
    </div>)
}

function DepositSection() {
    const {secret, setSecret} = useContext(SecretContext);
    const [generatingProof, setGeneratingProof] = useState(false);

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
        addressOrName: HURRICANE_CONTRACT_ADDRESS,
        contractInterface: HURRICANE_CONTRACT_ABI,
        functionName: 'numLeaves',
    });
    const numLeaves = numLeavesData.data;

    const siblingsData = useContractRead({
        addressOrName: HURRICANE_CONTRACT_ADDRESS,
        contractInterface: HURRICANE_CONTRACT_ABI,
        functionName: 'getPath',
        args: [numLeaves]
    });

    async function runProof() {
        const others = siblingsData.data!.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.data!.dirs.map((dir: BigNumber) => dir.toString());
        const input = {
            secret: secret!.toString(),
            mimcK: "0",
            others: others,
            dir: dir,
        }
        const {proof, publicSignals} = await groth16.fullProve(input, "circuit/depositor.wasm", "circuit/depositor.zkey");
        setProof(proof);
        setPublicSignals(publicSignals);
    }

    return (
        <div className={"mb-3"}>
            <h3 className={"text-lg text-black font-bold"}>
                DEPOSIT
            </h3>
            {
                secret ? (
                    <div>
                        <PrimaryButton onClick={() => {
                            setGeneratingProof(true);
                            runProof().then(() => {
                                setGeneratingProof(false);
                            })
                        }}>
                            Deposit 1 ETH
                        </PrimaryButton>
                        <div>
                            {
                                generatingProof ? (
                                    <span>Generating Proof ...</span>
                                ) : (
                                    <div>
                                        Proof
                                        <div
                                            className={"p-2 rounded-md font-mono text-sm bg-gray-300 whitespace-pre-wrap"}>
                                            {JSON.stringify(proof, null, 2)}
                                        </div>
                                        Public Input
                                        <div
                                            className={"p-2 rounded-md font-mono text-sm bg-gray-300 whitespace-pre-wrap"}>
                                            {JSON.stringify(publicSignals, null, 2)}
                                        </div>
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

export default function Content() {
    // const [proofError, setProofError] = useState("");
    // const [proof, setProof] = useState<{
    //     pi_a: [string, string],
    //     pi_b: [[string, string], [string, string]],
    //     pi_c: [string, string],
    // } | undefined>(undefined);
    // const [
    //     publicSignals,
    //     setPublicSignals
    // ] = useState<string[] | undefined>(undefined);

    // const args = (proof && publicSignals) ? [
    //     [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])],
    //     [
    //         [BigNumber.from(proof.pi_b[0][1]), BigNumber.from(proof.pi_b[0][0])],
    //         [BigNumber.from(proof.pi_b[1][1]), BigNumber.from(proof.pi_b[1][0])]
    //     ],
    //     [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])],
    //     publicSignals.map((s) => BigNumber.from(s)),
    // ] : [];
    //
    // async function runProof(a: number, b: number, c: number) {
    //     console.log("starting proof");
    //     const {proof, publicSignals} = await groth16.fullProve({
    //         a: a,
    //         b: b,
    //         c: c
    //     }, "circuit/multiply.wasm", "circuit/multiply.zkey");
    //     setProof(proof);
    //     setPublicSignals(publicSignals)
    // }

    // const {data, error, isError, isLoading} = useContractRead({
    //     addressOrName: VERIFIER_CONTRACT_ADDRESS,
    //     contractInterface: VERIFIER_CONTRACT_ABI,
    //     functionName: 'verifyProof',
    //     args: args,
    // });

    const [secret, setSecret] = useState<BigNumber | undefined>(undefined);

    return (
        <SecretContext.Provider value={{
            secret: secret,
            setSecret: setSecret,
        }}>
            <GenerateSecretSection/>
            <DepositSection/>
        </SecretContext.Provider>
    );
}