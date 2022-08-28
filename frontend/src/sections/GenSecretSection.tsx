import {useNetwork, useProvider, useSigner} from "wagmi";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES} from "../contracts/deployInfo";
import {BigNumber, Contract, ethers} from "ethers";
import React, {useContext, useEffect, useState} from "react";
import SecretContext, {generateSecret, Secret, secretToSharedKey, unmaskTokenData} from "../contexts/SecretContext";
import {AlertButton, PrimaryButton, SecondaryButton} from "../components/buttons";
import {Check, Copy} from "react-feather";
import {hexZeroPad} from "ethers/lib/utils";

function KeyDisplay(props: any) {
    const {removeKey, updateStatus} = useContext(SecretContext);

    const provider = useProvider()

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
            updateStatus?.(secret);
        }
        setRefreshing(false);
    }

    useEffect(() => {
        refresh();
        const filter = contract.filters.NewLeaf(hexZeroPad(secret.shared, 32));

        const listener = (event: any) => {
            console.log("New Leaf Event");
            console.log(event);
            refresh();
        }

        provider.on(filter, listener);

        return () => { provider.off(filter, listener); };
    }, []);

    return (
        <div className="flex flex-col gap-1">
            <h3 className={"text-stone-200 font-semibold"}>
                Give this Receive Key to the sender:
            </h3>
            <div className="flex flex-row gap-2 overflow-hidden">
                <SecondaryButton onClick={() => {
                    navigator.clipboard.writeText(secretToSharedKey(secret));
                    setEnableSharedCopy(false);
                    setTimeout(() => {
                        setEnableSharedCopy(true);
                    }, 1000);
                }} className={""} disabled={!enableSharedCopy}>
                    {enableSharedCopy ? <span>Copy</span> : <span>Copied!</span>}
                </SecondaryButton>
                <span
                    className={"px-1 bg-stone-100 text-zinc-900 rounded-md font-mono flex-1 text-ellipsis overflow-hidden min-w-0"}>
                    {secretToSharedKey(secret)}
                </span>
            </div>
            <div className={"grid text-white max-w-full"}>
                <SecondaryButton onClick={() => {
                    removeKey!(secret);
                }}>
                    Cancel
                </SecondaryButton>
            </div>
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
                <div className={"flex flex-col gap-2"}>
                    {
                        keys.map(function (secret, idx) {
                            return (
                                <div key={secret.shared.toString()}>
                                    <KeyDisplay secret={secret} idx={idx} contract={contract}/>
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