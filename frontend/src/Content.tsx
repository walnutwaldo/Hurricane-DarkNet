import React from 'react';

// @ts-ignore
const {groth16} = snarkjs;

export default function Content() {

    async function runProof() {
        console.log("starting proof");
        const {proof, publicSignals} = await groth16.fullProve({
            a: 10,
            b: 21
        }, "circuit/multiply.wasm", "circuit/multiply.zkey");
        console.log("Proof", proof);
        console.log("Public Signals", publicSignals);
    }

    return (
        <div>
            <form>
                <label>A:</label>
                <input type="text" name="a" className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
                <label>B:</label>
                <input type="text" name="b" className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
                <button onClick={async (e) => {
                    e.preventDefault();
                    return runProof();
                }} className={"bg-slate-200 p-1 rounded-md"}>Run Proof
                </button>
            </form>
        </div>
    );
}