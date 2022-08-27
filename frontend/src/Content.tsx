import React, {useContext, useState} from 'react';
import {Contract} from "ethers";
import SecretContext, {jsonToSecret, Secret, secretToJson, secretToPrivateKey} from './contexts/SecretContext';
import {DepositSection} from "./sections/DepositSection";
import {WithdrawSection} from "./sections/WithdrawSection";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES} from "./contracts/deployInfo";
import {useNetwork, useSigner} from "wagmi";
import {TransferSection} from "./sections/TransferSection";
import {GenerateSecretSection} from "./sections/GenSecretSection";
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {AlertButton, PrimaryButton, SecondaryButton, TabButton} from "./components/buttons";
import {useNftFromSecret} from "./utils/useNftFromSecret";
import NFTProvider from "./contexts/NFTContext";
import {ChevronDown, MoreVertical, X, XSquare} from "react-feather";

function AssetDisplay(props: any) {
    const {removeAsset, updateStatus} = useContext(SecretContext);

    const {secret, idx, setAssetSel, highlighted} = props;

    const [secretCopied, setSecretCopied] = useState(false);
    const [exportState, setExportState] = useState("Exporting");
    const [errMsg, setErrMsg] = useState("");

    const {nftContract, nftInfo, tokenAddress, tokenId} = useNftFromSecret(secret);

    const deleteButton = (
        <AlertButton onClick={() => {
            removeAsset!(idx);
        }}>
            Delete
        </AlertButton>
    )

    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className={"gap-1 text-stone-200"}>
            <div className={"grid grid-cols-3 pb-1 relative"}>
                <div>
                </div>
                <div className={"grid justify-center text-center courier-new"}>
                    <label><b>
                        {nftInfo?.name || "Loading NFT"}
                    </b></label>
                </div>
                <div className={"grid justify-end text-right hover:cursor-pointer hover:text-white"}>
                    <div className="inline-block text-left">
                        {
                            highlighted ? (
                                (exportState == "Exporting") && <span onClick={() => {
                                    setAssetSel("");
                                    setShowDropdown(false);
                                }}>
                                    <XSquare/>
                                </span>
                            ) : <MoreVertical onClick={() => {
                                setAssetSel(secret.shared.toString());
                                setShowDropdown(true);
                            }}/>
                        }
                        {
                            showDropdown && (
                                <div
                                    className={
                                        "origin-top-right absolute right-0 left-0 mt-2 rounded-md shadow-lg bg-stone-100" +
                                        " opacity-95 ring-1 ring-black ring-opacity-5 focus:outline-none"
                                    }
                                    role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                                    <div className="p-1 flex flex-col gap-1" role="none">
                                        <button
                                            className={"text-gray-700 block px-4 py-2 text-sm rounded-md bg-stone-100"
                                                + (!secretCopied && " hover:bg-stone-200 hover:text-black")
                                            }
                                            onClick={() => {
                                                navigator.clipboard.writeText(secretToPrivateKey(secret));
                                                setSecretCopied(true);
                                                setTimeout(() => {
                                                    setSecretCopied(false);
                                                }, 1000);
                                            }}
                                            disabled={secretCopied}
                                        >
                                            {secretCopied ? "Copied!" : "Export Secret"}
                                        </button>
                                        <button
                                            className="text-gray-700 block px-4 py-2 text-sm bg-red-200 rounded-md hover:bg-red-400 hover:text-white transition"
                                            onClick={() => {
                                                removeAsset!(idx);
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
            {nftInfo?.image ?
                <img className="rounded-md" alt={nftInfo.title} src={nftInfo.image} width={600}/>
                : <img className="rounded-md" alt={"Loading NFT Image"} src={"loading.jpg"} width={600}/>
            }
            <div className={
                "grid gap-2 text-white pt-1"
                + (exportState === "Exporting" ? " grid-cols-2" : " grid-cols-1")
            }>
                {((exportState == "Exporting") || (exportState == "Withdrawing")) &&
                    <WithdrawSection idx={idx} rm={removeAsset} setAssetSel={setAssetSel} setErrMsg={setErrMsg}
                                     setExportState={setExportState}/>
                }
                {((exportState == "Exporting") || (exportState == "Transferring")) &&
                    <TransferSection idx={idx} rm={removeAsset} setAssetSel={setAssetSel} setErrMsg={setErrMsg}
                                     setExportState={setExportState}/>
                }
            </div>
            {(errMsg == "") || <div className={"text-red-500"}> {errMsg} </div>}
        </div>
    )
}

export function DisplayExport(props: any) {
    const {secret} = props
    return (
        < span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
            {secret.toHexString().substr(0, 10) + "..."}
        </span>
    )
}

function YourAssetsSection() {
    const {keys, assets} = useContext(SecretContext);
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const [assetStart, setAssetStart] = useState(0);
    const [assetSel, setAssetSel] = useState("");

    return (
        <div className={"h-full flex flex-col"}>
            {
                assets.length == 0 ? (
                    <div className={"text-center my-auto"}>
                        You will find your assets here once you deposit into Hurricane.
                    </div>
                ) : <>
                    <div className={"grid grid-cols-8 gap-2"}>
                        <div className={"col-span-6"}>
                            <h3 className={"text-lg text-black font-bold"}>
                                HURRICANE NETWORK ASSETS
                            </h3>
                        </div>
                        {/*<PrimaryButton onClick={() => {*/}
                        {/*    setAssetStart(assetStart - 2);*/}
                        {/*}} disabled={assetStart == 0}>*/}
                        {/*    Back*/}
                        {/*</PrimaryButton>*/}
                        {/*<PrimaryButton onClick={() => {*/}
                        {/*    setAssetStart(assetStart + 2);*/}
                        {/*}} disabled={assetStart + 3 > assets.length}>*/}
                        {/*    Next*/}
                        {/*</PrimaryButton>*/}
                    </div>
                    {
                        <div className={"overflow-x-scroll pb-2"}>
                            <div className={"flex flex-row gap-2 pt-2 h-full shrink-0"}>
                                {
                                    assets.map(function (secret, idx) {
                                        const secretString = secret.shared.toString();
                                        return (
                                            <div key={secretString}
                                                 className={
                                                     "bg-stone-800 p-2 rounded-lg h-fit shrink-0 w-5/12"
                                                 }
                                            >
                                                <AssetDisplay
                                                    secret={secret}
                                                    idx={idx + assetStart}
                                                    setAssetSel={setAssetSel}
                                                    highlighted={assetSel === secretString}
                                                />
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    }
                </>
            }
        </div>
    )
}

function DepositReceiveSection() {
    const {data: signer, isError, isLoading} = useSigner();
    const [DRState, setDRState] = useState("");

    return (<div className="mb-3 flex flex-col h-full gap-4">
        <div className="flex flex-row gap-2 w-full">
            <div className="flex-1 grid grid-cols-2 gap-2">
                <TabButton onClick={() => {
                    setDRState("deposit");
                }} disabled={DRState == "deposit"} className={"flex-1"}>
                    Deposit
                </TabButton>
                <TabButton onClick={() => {
                    setDRState("receive");
                }} disabled={DRState == "receive"} className={"flex-1"}>
                    Receive
                </TabButton>
            </div>
            <div className={"p-2 bg-stone-800 rounded-xl"}>
                {signer && <div className={"mt-auto"}>
                    <ConnectButton/>
                </div>}
            </div>
        </div>
        <div className="flex-1">
            <div className="bg-darkgreen p-3 rounded-lg h-full">
                {
                    DRState == "" ? <></> :
                        (DRState == "deposit" ? <DepositSection/> : <GenerateSecretSection/>)
                }
            </div>
        </div>
    </div>)
}

const KEYS_LOCALHOST_KEY = 'hurricane_keys';
const ASSETS_LOCALHOST_KEY = 'hurricane_assets';

export default function Content() {
    const {data: signer, isError, isLoading} = useSigner();

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
            <NFTProvider>
                {signer ? <div className="grid grid-cols-12 gap-8 h-full">
                    <div className="col-span-5 h-full">
                        <YourAssetsSection/>
                    </div>
                    <div className="col-span-7">
                        <DepositReceiveSection/>
                    </div>
                </div> : <div className={"font-bold text-darkgreen text-2xl text-center h-full flex flex-col"}>
                    <div className={"my-auto flex flex-col gap-2 items-center"}>
                        <h1>Connect your wallet to be able to interact with Hurricane.</h1>
                    </div>
                </div>}
            </NFTProvider>
        </SecretContext.Provider>
    );
}
