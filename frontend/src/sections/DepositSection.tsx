import React, {useContext, useRef, useState} from "react";
import SecretContext from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";

// @ts-ignore
const {groth16, zKey} = snarkjs;
const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

export function DepositSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    console.log("chain name", chain?.name);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

	const shRef = useRef<HTMLInputElement>(null);

    const [isDepositing, setIsDepositing] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);
	const [depositErrMsg, setDepositErrMsg] = useState("");

	const {addAsset} = useContext(SecretContext);

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
                <div className="flex flex-row gap-2">
                    <PrimaryButton onClick={async () => {
						// first, generate
						console.log("Generating");
		                const randomBytes = crypto.getRandomValues(new Uint32Array(10));
    		            // Concatenate into hex string
        		        const secretString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
            		    const secret = BigNumber.from("0x" + secretString).mod(MODULUS);
                		const leaf = mimc(secret, "0");
                		console.log(leaf, await contract.leafForPubkey(leaf));
                        await makeDeposit(leaf);
                		const isPaid = await !((BigNumber.from(await contract.leafForPubkey(leaf))).isZero()); // should be true
		                addAsset!({
    		                secret: secret,
        		            shared: leaf,
                		});
                    }} disabled={isDepositing}>
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
				</div>
				<div className={"text-red-500"}>{depositErrMsg}</div>
			</div>
		</div>
    )
}
