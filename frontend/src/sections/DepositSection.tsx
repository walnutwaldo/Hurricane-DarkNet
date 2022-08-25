import React, {useContext, useRef, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import ActionContext from "../contexts/ActionContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";
import {ConnectButton} from '@rainbow-me/rainbowkit';
// @ts-ignore
const {groth16, zKey} = snarkjs;
const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

export function DepositSection() {
    const {chain, chains} = useNetwork()
    const secretContext = useContext(SecretContext);
    const actionContext = useContext(ActionContext);
    const [isDepositing, setIsDepositing] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);
	const [depositErrMsg, setDepositErrMsg] = useState("");

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";
    console.log("chain name", chain?.name);
    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);
	const shRef = useRef<HTMLInputElement>(null);

    function GenerateSecret() : BigNumber {
        const randomBytes = crypto.getRandomValues(new Uint32Array(10));
        // Concatenate into hex string
        const secretString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
        return BigNumber.from("0x" + secretString).mod(MODULUS);
    }
    async function makeDeposit() {
        setIsDepositing(true);
        setIsPreparingTxn(true);
        setDepositErrMsg("");
        const secret = GenerateSecret();
        const leaf = mimc(secret, 0);
        const tx = await contract.deposit(leaf, {
            value: ethers.utils.parseEther('0.1')
        }).catch((err: any) => {
            console.log(err);
            setIsDepositing(false);
            setIsPreparingTxn(false);
        });
        console.log("finished sending tx in metamask");
        setIsPreparingTxn(false);
        const result = await tx.wait();
        console.log("waited on tx");
        setIsDepositing(false);
        secretContext.addSecret!({
            secret: secret,
            shared: leaf
            });	   
    }

    return (
        <div>
            <div className={"bg-stone-800 p-2 rounded-lg"}>
                <div className={"mt-auto"}>
                            <ConnectButton/>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className = "m-2">
                    <PrimaryButton className = "text-white" type="submit" onClick={makeDeposit} disabled={isDepositing}>
                        Deposit 0.1 ETH

                    </PrimaryButton>
                    {isDepositing && (isPreparingTxn ? (
                        <span>
                                        Preparing transaction <InlineLoader/>
                                    </span>
                    ) : (
                        <span>
                                        Depositing <InlineLoader/>
                                    </span>
                    ))}
                    {isDepositing} 
                    <PrimaryButton type="submit" >
                        Receive
                    </PrimaryButton>
                </div>
                    <div className={"text-red-500"}>{depositErrMsg}</div>
                </div>
        </div>
    )
}
