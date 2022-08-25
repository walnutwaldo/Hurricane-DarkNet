import React, {useContext, useReducer, useState} from 'react';
import {BigNumber, Contract} from "ethers";
import SecretContext,  {Secret} from './contexts/SecretContext';
import {PrimaryButton, SecondaryButton, AlertButton} from "./components/buttons";
import {DepositSection} from "./sections/DepositSection";
import {WithdrawSection} from "./sections/WithdrawSection";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "./contracts/deployInfo";
import {useSigner, useNetwork} from "wagmi";
import mimc from "./crypto/mimc";
import {TransferSection} from "./sections/TransferSection";
import { rm } from 'fs';

const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

function AssetDisplay(props: any) {
    
    const {secret, shared, idx, rm} = props;
    
    const [enableExporting, setEnableExporting] = useState(true);
    const [enableIsPaidCopy, setEnableIsPaidCopy] = useState(true);
    return (
        <div className={"flex flex-row gap-3 text-white"}>
			<label><b>Your Asset Name</b></label>
            <WithdrawSection idx={idx} rm = {rm}/>
            <PrimaryButton onClick={() => {
                // Remove the secret
                console.log("i am the secret", secret);
                setEnableExporting(!enableExporting);
                if (enableExporting){
                    navigator.clipboard.writeText(shared!.toHexString());
                }
                return(<div></div>);
            }} >
                {enableExporting ? "Export Secret" : "Copy"}
            </PrimaryButton>
             {!enableExporting && <span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                    { secret.toHexString().substr(0,10) +"..."}
                </span> }
        </div>
    )
}
export function DisplayExport(props:any){
    const {secret} = props
    return (
        < span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
            {secret.toHexString().substr(0,10) + "..."}
        </span>
    )
}

function YourAssetsSection() {
    const {secrets, addSecret, removeSecret} = useContext(SecretContext);

    return (
        <div>
            <h3 className={"text-lg text-black font-bold"}>
                YOUR KEYS
            </h3>
            <div className={"flex flex-col gap-2"}>
                {
                    secrets.map(function (secret, idx) {
                        return (
                            
                            <div key={idx} className={"bg-stone-800 p-2 rounded-lg"}>
                                <div className="flex flex-row justify-between">
                                    {/*<span className={"text-white"}></span>*/}
                                    <AssetDisplay secret={secret.secret} shared={secret.shared} idx={idx} rm={removeSecret}/>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}



const SECRETS_LOCALHOST_KEY = 'hurricane_secrets';

export default function Content() {
    const {data: signer, isError, isLoading} = useSigner();
    console.log("signer", signer);

    const [secrets, setSecrets] = useState(
        JSON.parse(localStorage.getItem(SECRETS_LOCALHOST_KEY) || '[]').map((secretJson: any) => ({
            secret: BigNumber.from(secretJson.secret),
            shared: BigNumber.from(secretJson.shared),
        }))
    );

    function saveSecrets(newSecrets: Secret[]) {
        localStorage.setItem(SECRETS_LOCALHOST_KEY, JSON.stringify(
            newSecrets.map((secret) => ({
                secret: secret.secret.toString(),
                shared: secret.shared.toString(),
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
            {signer ? <div className="grid grid-cols- gap-8">
                <YourAssetsSection/>
                <div>
                    <DepositSection/> 
                </div>
            </div> : <div className={"font-bold text-red-500 text-2xl text-center"}>
                Connect your wallet to be able to interact with Hurricane.
            </div>}
        </SecretContext.Provider>
        
    );
}
