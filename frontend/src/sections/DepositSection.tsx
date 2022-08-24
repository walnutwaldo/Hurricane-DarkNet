import React, {useContext, useRef, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function DepositSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    console.log("chain name", chain?.name);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

	const shRef = useRef<HTMLInputElement>(null);

    const [isDepositing, setIsDepositing] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);
	const [depositErrMsg, setDepositErrMsg] = useState("");

    async function makeDeposit(currentShared: BigNumber ) {
        setIsDepositing(true);
        setIsPreparingTxn(true);
        const leaf = currentShared;
        const tx = await contract.deposit(leaf, {
            value: ethers.utils.parseEther('0.1')
        }).catch((err: any) => {
            console.log(err);
            setIsDepositing(false);
            setIsPreparingTxn(false);
        });
        setIsPreparingTxn(false);

        const result = await tx.wait();
        setIsDepositing(false);
    }

    return (
        <div className={"mb-3"}>
            <h3 className={"text-lg text-black font-bold"}>
                DEPOSIT
            </h3>
        	<div>
                <label>Shared key:</label>
                <input type="text" name="sharedTextbox" ref={shRef}
                       className={"ml-1 rounded-md outline-none bg-slate-100 px-1 mb-1"}/><br/>
                <div className="flex flex-row gap-2">
                    <PrimaryButton type="submit" onClick={() => {
                        setDepositErrMsg("");
                        let currentShared = BigNumber.from("0");
                        try {
                            currentShared = BigNumber.from(shRef.current!.value);
                        } catch (err) {
                            setDepositErrMsg("Use an actual number for the secret!");
                            return;
                        }
                        if (currentShared.gte(BigNumber.from("2").pow(BigNumber.from("256")))) {
                            setDepositErrMsg("Secret out of bounds");
                            return;
                        }
                        makeDeposit(currentShared).then(() => {
                        })
                    }} disabled={isDepositing}>
                    	Deposit 0.1 ETH
					</PrimaryButton>
				</div>
				<div className={"text-red-500"}>{depositErrMsg}</div>
			</div>
		</div>
    )
}
