import React, {useRef, useState} from 'react';
import {
    useContractRead,
    useContractWrite,
    usePrepareContractWrite,
    usePrepareSendTransaction,
    useSendTransaction
} from "wagmi";
import {BigNumber} from "ethers";
import VERIFIER_CONTRACT_ABI from "./contracts/verifier_abi.json";

// @ts-ignore
const {groth16, zKey} = snarkjs;

const VERIFIER_CONTRACT_ADDRESS = "0x05298fbF8C22BF842ce711bA5A018B29d6caF65a";

const MODULUS = BigNumber.from(2).pow(256).sub(BigNumber.from(2).pow(32)).sub(977)

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
        <div className={""}>
            <h3 className={"text-lg text-black font-bold"}>
                GENERATE A SECRET
            </h3>
            <div className={"flex flex-row gap-2"}>
                <button className={
                    "outline-none bg-teal-400 text-white rounded-md px-1 transition" +
                    " hover:scale-105 font-bold"
                } onClick={() => {
                    const randomBytes = crypto.getRandomValues(new Uint32Array(10));
                    // Concatenate into hex string
                    const secretString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
                    const secret = BigNumber.from("0x" + secretString).mod(MODULUS);
                    setSecret(secret);
                }}>
                    Generate
                </button>
                {
                    (secret !== undefined) && (
                        <>
                            <button className={
                                "outline-none bg-zinc-400 text-white rounded-md px-1 transition" +
                                " hover:scale-105 font-bold"
                            } onClick={() => {
                                // Copy secret.toHexString() to clipboard
                                navigator.clipboard.writeText(secret.toHexString());
                            }}>
                                Copy
                            </button>
                            <span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md"}>
                            {secret.toHexString()}
                        </span>
                        </>
                    )
                }
            </div>
        </div>
    );
}