import React, {useContext, useRef, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import {useNetwork, useSigner} from "wagmi";
import {PrimaryButton} from "../components/buttons";
import {BigNumber, Contract} from "ethers";
import {
    HURRICANE_CONTRACT_ABI,
    HURRICANE_CONTRACT_ADDRESSES
} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";
import {useNftFromSecret} from "../utils/useNftFromSecret";

// @ts-ignore
const {groth16, zKey} = snarkjs;
const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

export function WithdrawSection(props: any) {
    const {idx, rm} = props
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";
    const secretContext = useContext(SecretContext);

    const [generatingProof, setGeneratingProof] = useState(false);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const sRef = useRef<HTMLInputElement>(null);
    const currentSecret = secretContext!.assets[idx];

    const [nftContract, nftInfo] = useNftFromSecret(currentSecret);

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

    async function runProof(
        secret: {
            secret: BigNumber,
            noise: BigNumber
        }
    ) {
        const leafIdx = await contract.leafForPubkey(mimc(secret.secret, "0"));
        const siblingsData = await contract.getPath(leafIdx);
        const others = siblingsData.siblings.map((sibling: BigNumber) => sibling.toString());
        const dir = siblingsData.dirs.map((dir: BigNumber) => dir.toString());
        const rootIdx = siblingsData.rootIdx;

        const input = {
            mimcK: "0",
            tokenAddress: nftInfo.contract.address,
            tokenId: nftInfo.tokenId,
            withdrawer: await signer!.getAddress(),
            secret: secret.secret.toString(),
            secretNoise: secret.noise.toString(),
            others: others,
            dir: dir,
        }
        const {
            proof,
            publicSignals
        } = await groth16.fullProve(input, "circuit/withdraw.wasm", "circuit/withdraw.zkey");

        const merkleRoot = publicSignals[0];

        console.log({
            leafIdx,
            others,
            dir,
            rootIdx,
            merkleRoot
        });

        setProof(proof);
        setRootIdx(rootIdx);
        setPublicSignals(publicSignals);

        const res = {
            proof: proof,
            publicSignals: publicSignals,
            rootIdx: rootIdx
        }
        console.log("proof res", res);

        return res;
    }

    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawErrMsg, setWithdrawErrMsg] = useState("");
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);

    async function makeWithdrawal(proofRes: any) {
        const {
            proof,
            publicSignals,
            rootIdx
        } = proofRes;

        setIsWithdrawing(true);
        setIsPreparingTxn(true);

        const proofArgs = (proof && publicSignals && rootIdx) ? [
            [BigNumber.from(proof.pi_a[0]), BigNumber.from(proof.pi_a[1])],
            [
                [BigNumber.from(proof.pi_b[0][1]), BigNumber.from(proof.pi_b[0][0])],
                [BigNumber.from(proof.pi_b[1][1]), BigNumber.from(proof.pi_b[1][0])]
            ],
            [BigNumber.from(proof.pi_c[0]), BigNumber.from(proof.pi_c[1])],
            publicSignals.map((s: string) => BigNumber.from(s))
        ] : [];

        const tx = await contract.withdraw(
            ...proofArgs,
            rootIdx,
        ).catch((err: any) => {
            console.log(err);
            setWithdrawErrMsg("Withdraw failed (possibly secret already taken)");
            setIsWithdrawing(false);
            setIsPreparingTxn(false);
        });
        setIsPreparingTxn(false);
        let result = await tx.wait(); // dis
        if (!result?.status) {
            setWithdrawErrMsg("Withdraw failed (possibly secret already taken)");
        }
        setIsWithdrawing(false);
        setProof(undefined);
        rm!(idx);
    }

    return (
        <div className={""}>
            <h3 className={"text-lg text-white font-bold"}>
            </h3>
            <PrimaryButton type="submit" onClick={() => {
                setWithdrawErrMsg("");
                setGeneratingProof(true);
                runProof(currentSecret).then((proofRes) => {
                    setGeneratingProof(false);
                    makeWithdrawal(proofRes).then();
                })
                
                }} disabled={generatingProof || isWithdrawing}>
                {isWithdrawing ? <span>Withdrawing<InlineLoader/></span> : "Withdraw"}
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
