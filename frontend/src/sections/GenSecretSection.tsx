import {useNetwork, useSigner} from "wagmi";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES} from "../contracts/deployInfo";
import {BigNumber, Contract} from "ethers";
import React, {useContext, useEffect, useState} from "react";
import SecretContext, {generateSecret, Secret, secretToSharedKey, unmaskTokenData} from "../contexts/SecretContext";
import {AlertButton, PrimaryButton, SecondaryButton} from "../components/buttons";

function KeyDisplay(props: any) {
    const {removeKey, updateStatus} = useContext(SecretContext);

    const {secret, idx, contract} = props;

    const [enableSharedCopy, setEnableSharedCopy] = useState(true);
    const [enableIsPaidCopy, setEnableIsPaidCopy] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function refresh() {
        setRefreshing(true);
        const leafIdx = BigNumber.from(await contract.leafForPubkey(secret.shared));
        if (leafIdx.isZero()) {
            setRefreshing(false);
            return;
        }

        const maskedData = await contract.dataForPubkey(secret.shared);
        const {tokenAddress, tokenId} = unmaskTokenData(maskedData, secret);
        const leaf = await contract.calcLeaf(
            secret.shared,
            tokenAddress,
            tokenId,
            secret.noise
        );
        const isPaid = (await contract.getLeaf(leafIdx)).eq(leaf);
        if (isPaid) {
            updateStatus?.(idx);
        }
        setRefreshing(false);
    }

    useEffect(() => {
        refresh();
    }, [contract]);

    return (
        <div className={"flex flex-row gap-3 text-white max-w-full"}>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(secretToSharedKey(secret));
                setEnableSharedCopy(false);
                setTimeout(() => {
                    setEnableSharedCopy(true);
                }, 1000);
            }} disabled={!enableSharedCopy}>
                {enableSharedCopy ? "Copy Key" : "Copied!"}
            </SecondaryButton>
            <span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono flex-1 text-ellipsis overflow-hidden min-w-0"}>
               	{secretToSharedKey(secret)}
           	</span>
            <SecondaryButton onClick={refresh} disabled={refreshing}>
                Refresh Status
            </SecondaryButton>
            <AlertButton onClick={() => {
                removeKey!(idx);
            }}>
                Delete
            </AlertButton>
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
            {keys.length == 0 ? "No outgoing requests." : <>
                <h3 className={"text-lg text-lightgreen font-bold"}>
                    Your Requests
                </h3>
                <div className={"flex flex-col gap-2"}>
                    {
                        keys.map(function (secret, idx) {
                            return (
                                <div key={secret.shared.toString()} className={"bg-stone-100 p-2 rounded-lg"}>
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
        <h3 className={"text-lg text-lightgreen font-bold mb-2"}>
            RECEIVE ASSETS
        </h3>
        <div className="flex flex-row gap-1">
            <PrimaryButton
                onClick={async () => {
                    addKey!(generateSecret());
                }}
                className={"w-full py-2"}
            >
                Generate Receive Key
            </PrimaryButton>
        </div>
        {
            keys.length == 0 ? <></> : <div className="pt-2">
                <YourKeysSection/>
            </div>
        }
    </div>)
}