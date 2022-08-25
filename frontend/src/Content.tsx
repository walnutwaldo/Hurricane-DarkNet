import React, {useContext, useEffect, useState} from 'react';
import {BigNumber, Contract} from "ethers";
import SecretContext, {
    jsonToSecret,
    Secret,
    secretToJson,
    secretToPrivateKey,
    secretToSharedKey, unmaskTokenData
} from './contexts/SecretContext';
import {AlertButton, SecondaryButton} from "./components/buttons";
import {DepositSection} from "./sections/DepositSection";
import {WithdrawSection} from "./sections/WithdrawSection";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES} from "./contracts/deployInfo";
import {useNetwork, useSigner} from "wagmi";
import {TransferSection} from "./sections/TransferSection";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import NFTSection from "./sections/NFTSection";
import {GenerateSecretSection} from "./sections/GenSecretSection";

function SecretDisplay(props: {
    secret: Secret,
} & any) {

    const {removeAsset, removeKey, updateStatus} = useContext(SecretContext);

    const {secret, idx, upd, contract, isAsset} = props;

    const [enableSecretCopy, setEnableSecretCopy] = useState(isAsset);
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
        const { tokenAddress, tokenId } = unmaskTokenData(maskedData, secret);
        const leaf = await contract.calcLeaf(
            secret.shared,
            tokenAddress,
            tokenId,
            secret.noise
        );
        const isPaid =await contract.getLeaf(leafIdx) == leaf;
        if (isPaid) {
            updateStatus?.(idx);
        }
        setRefreshing(false);
    }

    useEffect(() => {
        if (contract) {
            refresh();
        }
    }, [contract])

    return (
        <div className={"flex flex-row gap-3 text-white"}>
            <AlertButton onClick={() => {
                {
                    isAsset ? removeAsset!(idx) : removeKey!(idx)
                }
                ;
            }}>
                Delete
            </AlertButton>
            <label><b>Secret key:</b></label>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(secretToPrivateKey(secret));
                setEnableSecretCopy(false);
                setTimeout(() => {
                    setEnableSecretCopy(true);
                }, 1000);
            }} disabled={!enableSecretCopy}>
                {enableSecretCopy || !isAsset ? "Copy" : "Copied!"}
            </SecondaryButton>
            <span className={"px-1 bg-zinc-400 text-zinc-900 rounded-md font-mono"}>
                {secretToPrivateKey(secret).substr(0, 6) + "..."}
            </span>
            {
                isAsset ? <></> : <>
                    <label><b>Shared key:</b></label>
                    <SecondaryButton onClick={() => {
                        // Copy secret.toHexString() to clipboard
                        navigator.clipboard.writeText(secretToSharedKey(secret));
                        setEnableSharedCopy(false);
                        setTimeout(() => {
                            setEnableSharedCopy(true);
                        }, 1000);
                    }} disabled={!enableSharedCopy}>
                        {enableSharedCopy ? "Copy" : "Copied!"}
                    </SecondaryButton>
                    <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                	{secretToSharedKey(secret).substr(0, 6) + "..."}
            	</span>
                    <label><b>Status:</b></label>
                    <SecondaryButton onClick={refresh} disabled={refreshing}>
                        Refresh
                    </SecondaryButton>
                    <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                	Unpaid
            	</span>
                </>
            }
        </div>
    )
}

function YourAssetsSection() {
    const {keys, assets} = useContext(SecretContext);
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    return (
        <div>
            {
                keys.length + assets.length == 0 ? "Add assets or generate key to begin." : <>
                    {
                        assets.length == 0 ? <></> : <>
                            <h3 className={"text-lg text-black font-bold"}>
                                YOUR ASSETS
                            </h3>
                            <div className={"flex flex-col gap-2"}>
                                {
                                    assets.map(function (secret, idx) {
                                        return (
                                            <div key={idx} className={"bg-stone-800 p-2 rounded-lg"}>
                                                <div className="flex flex-row justify-between">
                                                    {/*<span className={"text-white"}></span>*/}
                                                    <SecretDisplay secret={secret} idx={idx} contract={contract} isAsset={true}/>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </>
                    }
                    {
                        keys.length == 0 ? <></> : <>
                            <h3 className={"text-lg text-black font-bold"}>
                                YOUR KEYS
                            </h3>
                            <div className={"flex flex-col gap-2"}>
                                {
                                    keys.map(function (secret, idx) {
                                        return (
                                            <div key={idx} className={"bg-stone-800 p-2 rounded-lg"}>
                                                <div className="flex flex-row justify-between">
                                                    {/*<span className={"text-white"}></span>*/}
                                                    <SecretDisplay secret={secret} idx={idx} contract={contract} isAsset={false}/>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </>
                    }
                </>
            }
        </div>
    )
}

const KEYS_LOCALHOST_KEY = 'hurricane_keys';
const ASSETS_LOCALHOST_KEY = 'hurricane_assets';

export default function Content() {
    const {data: signer, isError, isLoading} = useSigner();
    console.log("signer", signer);

    const [keys, setKeys] = useState(
        JSON.parse(localStorage.getItem(KEYS_LOCALHOST_KEY) || '[]').map(jsonToSecret)
    );

    function saveKeys(newKeys: Secret[]) {
        localStorage.setItem(KEYS_LOCALHOST_KEY, JSON.stringify(
            newKeys.map(secretToJson)
        ));
    }

    const [assets, setAssets] = useState(
        JSON.parse(localStorage.getItem(ASSETS_LOCALHOST_KEY) || '[]').map(jsonToSecret)
    );

    function saveAssets(newAssets: Secret[]) {
        localStorage.setItem(ASSETS_LOCALHOST_KEY, JSON.stringify(
            newAssets.map(secretToJson)
        ));
    }

    function addKey(newKey: Secret,) {
        const newKeys = [...keys, newKey];
        saveKeys(newKeys);
        setKeys(newKeys);
    }

    function addAsset(newAsset: Secret,) {
        const newAssets = [...assets, newAsset];
        saveAssets(newAssets);
        setAssets(newAssets);
    }

    function removeKey(idx: number) {
        const newKeys = [...keys];
        newKeys.splice(idx, 1);
        saveKeys(newKeys);
        setKeys(newKeys);
    }

    function removeAsset(idx: number) {
        const newAssets = [...assets];
        newAssets.splice(idx, 1);
        saveAssets(newAssets);
        setAssets(newAssets);
    }

    function updateStatus(idx: number) {
        const newSecret = keys[idx];
        removeKey(idx);
        addAsset(newSecret);
    }

    return (
        <SecretContext.Provider value={{
            keys: keys,
            assets: assets,
            addKey: addKey,
            addAsset: addAsset,
            removeKey: removeKey,
            removeAsset: removeAsset,
            updateStatus: updateStatus
        }}>
            {signer ? <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2">
                    <YourAssetsSection/>
                </div>
                <div>
                    <GenerateSecretSection/>
                    <DepositSection/>
                    <WithdrawSection/>
                    <TransferSection/>
                    <NFTSection/>
                </div>
            </div> : <div className={"font-bold text-darkgreen text-2xl text-center h-full flex flex-col"}>
                <div className={"my-auto flex flex-col gap-2 items-center"}>
                    <h1>Connect your wallet to be able to interact with Hurricane.</h1>
                    <ConnectButton/>
                </div>
            </div>}
        </SecretContext.Provider>

    );
}
