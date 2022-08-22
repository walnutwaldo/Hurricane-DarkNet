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

export default function Content() {
    const [proofError, setProofError] = useState("");
    const [proof, setProof] = useState<{
        pi_a: [string, string],
        pi_b: [[string, string], [string, string]],
        pi_c: [string, string],
    } | undefined>(undefined);
    const [
        publicSignals,
        setPublicSignals
    ] = useState<string[] | undefined>(undefined);

    const aRef = useRef<HTMLInputElement>(null);
    const bRef = useRef<HTMLInputElement>(null);
    const cRef = useRef<HTMLInputElement>(null);

    const args = (proof && publicSignals) ? [
        [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])],
        [
            [BigNumber.from(proof.pi_b[0][1]), BigNumber.from(proof.pi_b[0][0])],
            [BigNumber.from(proof.pi_b[1][1]), BigNumber.from(proof.pi_b[1][0])]
        ],
        [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])],
        publicSignals.map((s) => BigNumber.from(s)),
    ] : [];

    async function runProof(a: number, b: number, c: number) {
        console.log("starting proof");
        const {proof, publicSignals} = await groth16.fullProve({
            a: a,
            b: b,
            c: c
        }, "circuit/multiply.wasm", "circuit/multiply.zkey");
        // console.log(await groth16.exportSolidityCallData(publicSignals, proof));
        setProof(proof);
        setPublicSignals(publicSignals)
    }

    const {data, error, isError, isLoading} = useContractRead({
        addressOrName: VERIFIER_CONTRACT_ADDRESS,
        contractInterface: VERIFIER_CONTRACT_ABI,
        functionName: 'verifyProof',
        args: args,
    });

    async function verifyProof() {
        // console.log("data", data);
        // const txnResponse = await data.wait();
        // console.log("txnResponse", txnResponse);
    }

    const ProofSection = (<div>
        <h2 className={"font-bold text-xl mb-2"}>Prover</h2>
        <form onSubmit={
            async (e) => {
                e.preventDefault();
                // Get fields A and B as numbers
                const a = parseInt(aRef.current!.value);
                const b = parseInt(bRef.current!.value);
                const c = parseInt(cRef.current!.value);
                if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) {
                    setProofError("Please enter valid numbers");
                } else {
                    setProofError("");
                    return runProof(a, b, c);
                }
            }
        }>
            <label>A:</label>
            <input type="text" name="a" ref={aRef}
                   className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
            <label>B:</label>
            <input type="text" name="b" ref={bRef}
                   className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
            <label>C:</label>
            <input type="text" name="c" ref={cRef}
                   className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
            <button type="submit" className={"bg-slate-200 p-1 rounded-md"}>
                Generate Proof
            </button>
        </form>
        <div className={"text-red-500"}>{proofError}</div>
        {proof && (
            <div>
                <h1>Proof</h1>
                <div className={"bg-slate-100 p-1 rounded-md whitespace-pre-wrap text-sm font-mono overflow-scroll"}>
                    {JSON.stringify(proof, null, '\t')}
                </div>
            </div>
        )}
        {publicSignals && (
            <div>
                <h1>Public Signals</h1>
                <div className={"bg-slate-100 p-1 rounded-md whitespace-pre-wrap text-sm font-mono overflow-scroll"}>
                    {JSON.stringify(publicSignals, null, '\t')}
                </div>
            </div>
        )}
    </div>);

    const VerifySection = (
        <div>
            <h2 className={"font-bold text-xl mb-2"}>Verifier</h2>
            {
                proof ? (
                    <div>
                        {/*<button className={"bg-slate-200 p-1 rounded-md"} onClick={verifyProof}>*/}
                        {/*    Verify*/}
                        {/*</button>*/}
                        {isLoading && <div>Verifying proof ...</div>}
                        {!isLoading && data && (
                            <div>
                                <h3 className="font-bold text-md">Valid:</h3>
                                {JSON.stringify(data, null, '\t')}
                            </div>
                        )}
                        {isError && (
                            <div>
                                <h3 className="font-bold text-md">Error:</h3>
                                <div className={"bg-slate-100 p-1 rounded-md whitespace-pre-wrap text-sm font-mono overflow-scroll"}>
                                    {JSON.stringify(error, null, '\t')}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <span>No proof to verify</span>
                )
            }
        </div>
    )

    return (
        <div className={"grid grid-cols-2"}>
            {ProofSection}
            {VerifySection}
        </div>
    );
}