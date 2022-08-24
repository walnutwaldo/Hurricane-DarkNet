import React, {useContext, useReducer, useState} from 'react';
import {BigNumber, Contract} from "ethers";
import SecretContext, {Secret} from './contexts/SecretContext';
import {PrimaryButton, SecondaryButton, AlertButton} from "./components/buttons";
import {DepositSection} from "./sections/DepositSection";
import {WithdrawSection} from "./sections/WithdrawSection";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "./contracts/deployInfo";
import {useSigner, useNetwork} from "wagmi";
import mimc from "./crypto/mimc";

const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

function SecretDisplay(props: any) {
    
    const {secret, shared, idx, rm, isPaid} = props;
    
    const [enableSecretCopy, setEnableSecretCopy] = useState(true);
	const [enableSharedCopy, setEnableSharedCopy] = useState(true);
    const [enableIsPaidCopy, setEnableIsPaidCopy] = useState(true);
    return (
        <div className={"flex flex-row gap-5"}>
			<AlertButton onClick={() => {
					// Delete secret
					rm!(idx);
			}}>
				Delete
			</AlertButton>
			<label><b>Shared key:</b></label>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(shared!.toHexString());
                setEnableSharedCopy(false);
                setTimeout(() => {
                    setEnableSharedCopy(true);
                }, 1000);
            }} disabled={!enableSharedCopy}>
                {enableSharedCopy ? "Copy" : "Copied!"}
            </SecondaryButton>
            <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                {shared.toHexString().substr(0,10) + "..."}
            </span>
			<label><b>Secret key:</b></label>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(secret!.toHexString());
                setEnableSecretCopy(false);
                setTimeout(() => {
                    setEnableSecretCopy(true);
                }, 1000);
            }} disabled={!enableSecretCopy}>
                {enableSecretCopy ? "Copy" : "Copied!"}
            </SecondaryButton>
            <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                {secret.toHexString().substr(0,10) + "..."}
            </span>
            <label><b>Used?:</b></label>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(isPaid!.toHexString());
                setEnableSecretCopy(false);
                setTimeout(() => {
                    setEnableSecretCopy(true);
                }, 1000);
            }} disabled={!enableSecretCopy}>
                {enableSecretCopy ? "Copy" : "Copied!"}
            </SecondaryButton>
            <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                {isPaid}
            </span>
        </div>
    )
}

function GenerateSecretSection() {
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);
    
    const {secrets, addSecret, removeSecret} = useContext(SecretContext);
    const [enableCopy, setEnableCopy] = useState(true);

    return (<div className={"mb-3"}>
        <h3 className={"text-lg text-black font-bold"}>
            GENERATE A SECRET
        </h3>
        <div className="flex flex-row gap-2">
            <PrimaryButton onClick={async () => {
				console.log("Generating");
                const randomBytes = crypto.getRandomValues(new Uint32Array(10));
                // Concatenate into hex string
                const secretString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
                const secret = BigNumber.from("0x" + secretString).mod(MODULUS);
				const leaf = mimc(secret, "0");
                const isPaid = (await contract.indexOfLeaf(mimc(secret, "0", 91))).eq(0);
                addSecret!({
					secret: secret,
					shared: leaf,
                    isPaid: isPaid
				});
			}}>
                Generate 
            </PrimaryButton>
        </div>
       	{
			secrets.length > 0 && (
			<>
        	<h3 className={"text-lg text-black font-bold"}>
            	YOUR SECRETS 
        	</h3>
        	<div>
            	{
                	secrets.map(function (secret, idx) {
                    	return (
                        	<div key={idx}>
                            	<SecretDisplay secret={secret.secret} shared={secret.shared} idx={idx} rm={removeSecret} isPaid = {secret.isPaid}/>
                        	</div>
                    	)
                	})
            	}
    		</div>
			</>
			)
		}
    </div>)
}

const SECRETS_LOCALHOST_KEY = 'hurricane_secrets';

export default function Content() {
    const {data: signer, isError, isLoading} = useSigner();
    console.log("signer", signer);

    const [secrets, setSecrets] = useState(
        JSON.parse(localStorage.getItem(SECRETS_LOCALHOST_KEY) || '[]').map((secretJson: any) => ({
            secret: BigNumber.from(secretJson.secret),
            shared: BigNumber.from(secretJson.shared),
            isPaid: Boolean(secretJson.isPaid)
        }))
    );

    function saveSecrets(newSecrets: Secret[]) {
        localStorage.setItem(SECRETS_LOCALHOST_KEY, JSON.stringify(
            newSecrets.map((secret) => ({
                secret: secret.secret.toString(),
                shared: secret.shared.toString(),
                isPaid: secret.isPaid.toString()
            }))
        ));
    }

    function addSecret(newSecret: Secret, ) {
        const newSecrets = [...secrets, newSecret];
        saveSecrets(newSecrets);
        setSecrets(newSecrets);
    }

    function removeSecret(idx: number) {
        const newSecrets = [...secrets];
        newSecrets.splice(idx, 1);
        saveSecrets(newSecrets);
        setSecrets(newSecrets);
    }

    return (
        <SecretContext.Provider value={{
            secrets: secrets,
            addSecret: addSecret,
            removeSecret: removeSecret,
        }}>
            <GenerateSecretSection/>
            {signer ? <div className="grid grid-cols-2 gap-2">
                <DepositSection/>
                <WithdrawSection/>
            </div> : <div className={"font-bold text-red-500 text-2xl text-center"}>
                Connect your wallet to be able to interact with Hurricane.
            </div>}
        </SecretContext.Provider>

    );
}
