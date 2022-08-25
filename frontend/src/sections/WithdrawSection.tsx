import React, {useContext, useRef, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {PrimaryButton, SecondaryButton, AlertButton} from "../components/buttons";
import {BigNumber, Contract, ethers} from "ethers";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";

// @ts-ignore
const {groth16, zKey} = snarkjs;
const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

export function WithdrawSection(props: any) {
    const {idx, rm} = props
    const {chain, chains} = useNetwork()

    const secretContext = useContext(SecretContext);

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
    
    const [rootIdx, setRootIdx] = useState<BigNumber | undefined>(undefined);

    async function runProof(currentSecret: BigNumber) {
        const siblingsData = await contract.getPath(await contract.indexOfLeaf(mimc(currentSecret, "0")));
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        const rootIdx = siblingsData.rootIdx;

        console.log(siblingsData);
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
        setRootIdx(rootIdx);
        setPublicSignals(publicSignals);
        console.log("publicSignals", publicSignals);
    }

    const withdrawArgs = (proof && publicSignals && rootIdx) ? [
        [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])],
        [
            [BigNumber.from(proof.pi_b[0][1]), BigNumber.from(proof.pi_b[0][0])],
            [BigNumber.from(proof.pi_b[1][1]), BigNumber.from(proof.pi_b[1][0])]
        ],
        [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])],
        publicSignals.map((s) => BigNumber.from(s)),
		BigNumber.from(rootIdx),
    ] : [];

    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawErrMsg, setWithdrawErrMsg] = useState("");
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);

    async function makeWithdrawal() {
        setIsWithdrawing(true);

        setIsPreparingTxn(true);
		console.log(...withdrawArgs);
        const tx = await contract.withdraw(...withdrawArgs).catch((err: any) => {
            console.log(err);
            setWithdrawErrMsg("Withdraw failed (possibly secret already taken)");
            setIsWithdrawing(false);
            setIsPreparingTxn(false);
        });
        setIsPreparingTxn(false);
        let result = await tx.wait(); // dis    
        setIsWithdrawing(false);
        setProof(undefined);
    }

    return (
        <div className={""}>
            <h3 className={"text-lg text-white font-bold"}>
            </h3>
            <PrimaryButton type="submit" onClick={() => {
                setWithdrawErrMsg("");
                let currentSecret = BigNumber.from("0");
                try {
                    console.log(BigNumber.from(secretContext!.assets[idx].secret));
                    console.log(BigNumber.from("2").pow(BigNumber.from("500")));
                    console.log(MODULUS);
                    currentSecret = BigNumber.from(secretContext!.assets[idx].secret);
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
                	makeWithdrawal();
                })
                }} disabled={generatingProof}>
                    {isWithdrawing ? "Withdrawing" : "Withdraw"}
                    {generatingProof ? "Generating Proof": ""}
                    { isPreparingTxn ? "Preparing Transaction" :""}
            </PrimaryButton>
            <div>
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
    )
}
