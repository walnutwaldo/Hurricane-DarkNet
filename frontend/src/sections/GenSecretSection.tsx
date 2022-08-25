import {useNetwork, useSigner} from "wagmi";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES} from "../contracts/deployInfo";
import {BigNumber, Contract} from "ethers";
import React, {useContext, useState} from "react";
import SecretContext, {generateSecret, Secret} from "../contexts/SecretContext";
import {AlertButton, PrimaryButton, SecondaryButton} from "../components/buttons";

function KeyDisplay(props: any) {
    const {removeKey, updateStatus} = useContext(SecretContext);

    const {secret, idx, contract} = props;

    const [enableSharedCopy, setEnableSharedCopy] = useState(true);
    const [enableIsPaidCopy, setEnableIsPaidCopy] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    return (
        <div className={"flex flex-row gap-3 text-white"}>
            <AlertButton onClick={() => {
                removeKey!(idx);
            }}>
                Delete
            </AlertButton>
            <label><b>Shared key:</b></label>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(secret.shared!.toHexString());
                setEnableSharedCopy(false);
                setTimeout(() => {
                    setEnableSharedCopy(true);
                }, 1000);
            }} disabled={!enableSharedCopy}>
                {enableSharedCopy ? "Copy" : "Copied!"}
            </SecondaryButton>
            <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
               	{secret.shared.toHexString().substr(0,6) + "..."}
           	</span>
            <label><b>Status:</b></label>
            <SecondaryButton onClick={async () => {
                setRefreshing(true);
                const isPaid = !(BigNumber.from(await contract.indexOfLeaf(secret.shared)).isZero());
                if (isPaid) {
                    updateStatus?.(idx);
                }
                setRefreshing(false);
            }} disabled={refreshing}>
                Refresh
            </SecondaryButton>
            <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                Unpaid
            </span>
        </div>
    )
}

function YourKeysSection() {
    const {keys, assets, updateStatus} = useContext(SecretContext);
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    return (
        <div>
            { keys.length == 0 ? "No outgoing requests." : <>
                <h3 className={"text-lg text-cyan-100 font-bold"}>
                    YOUR REQUESTS
                </h3>
                <div className={"flex flex-col gap-2"}>
                    {
                        keys.map(function (secret, idx) {
                            return (
                                <div key={idx} className={"bg-stone-800 p-2 rounded-lg"}>
                                    <div className="flex flex-row justify-between">
                                        {/*<span className={"text-white"}></span>*/}
                                        <KeyDisplay secret={secret} idx={idx} contract={contract}/>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </>
            }
        </div>
    )
}

export function GenerateSecretSection() {
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const {addKey, keys} = useContext(SecretContext);
    const [enableCopy, setEnableCopy] = useState(true);

    return (<div>
        <h3 className={"text-lg text-cyan-100 font-bold"}>
            GENERATE A RECEPTION KEY
        </h3>
        <div className="flex flex-row gap-2">
            <PrimaryButton onClick={async () => {
                addKey!(generateSecret());
            }}>
                Generate
            </PrimaryButton>
        </div>
        {
            keys.length == 0 ? <></> : <div className="pt-6">
                <YourKeysSection/>
            </div>
        }
    </div>)
}