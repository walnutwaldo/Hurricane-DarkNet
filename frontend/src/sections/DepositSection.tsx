import React, {useContext, useState} from "react";
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
    const {secret, setSecret, addDeposit} = useContext(SecretContext);
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    console.log("chain name", chain?.name);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const [isDepositing, setIsDepositing] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);

    async function makeDeposit() {
        setIsDepositing(true);
        setIsPreparingTxn(true);
        const leaf = mimc(secret, "0");
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
        if (result.status) {
            addDeposit?.({
                secret: secret!,
                leaf: leaf
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
                                    makeDeposit();
                                }} disabled={isDepositing}>
                                    {
                                        isDepositing ? <span>Depositing <InlineLoader/></span> : "Deposit 0.1 ETH"
                                    }
                                </PrimaryButton>
                            </div>
                            {isPreparingTxn && (
                                <div>
                                    Preparing transaction <InlineLoader/>
                                </div>
                            )}
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
