import React, {useRef, useState} from 'react';

// @ts-ignore
const {groth16, zKey} = snarkjs;

export default function Content() {
    const [error, setError] = useState("");
    const [proof, setProof] = useState(undefined);
    const [publicSignals, setPublicSignals] = useState(undefined);

    const aRef = useRef<HTMLInputElement>(null);
    const bRef = useRef<HTMLInputElement>(null);
    const cRef = useRef<HTMLInputElement>(null);

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

    return (
        <div>
            <form onSubmit={
                async (e) => {
                    e.preventDefault();
                    // Get fields A and B as numbers
                    const a = parseInt(aRef.current!.value);
                    const b = parseInt(bRef.current!.value);
                    const c = parseInt(cRef.current!.value);
                    if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) {
                        setError("Please enter valid numbers");
                    } else {
                        setError("");
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
            <div className={"text-red-500"}>{error}</div>
            {proof && (
                <div>
                    <h1>Proof</h1>
                    <div className={"bg-slate-100 p-1 rounded-md whitespace-pre-wrap text-sm font-mono"}>
                        {JSON.stringify(proof, null, '\t')}
                    </div>
                </div>
            )}
            {publicSignals && (
                <div>
                    <h1>Public Signals</h1>
                    <div className={"bg-slate-100 p-1 rounded-md whitespace-pre-wrap text-sm font-mono"}>
                        {JSON.stringify(publicSignals, null, '\t')}
                    </div>
                </div>
            )}
        </div>
    );
}