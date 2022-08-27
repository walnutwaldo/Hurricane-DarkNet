import React, {useContext, useState} from 'react';
import {Contract} from "ethers";
import SecretContext, {jsonToSecret, Secret, secretToJson} from './contexts/SecretContext';
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

function AssetDisplay(props: any) {
    const {removeAsset, updateStatus} = useContext(SecretContext);

    const {secret, idx, setAssetSel, highlighted} = props;

    const [enableSecretCopy, setEnableSecretCopy] = useState(true);
    const [enableExporting, setEnableExporting] = useState(true);
    const [exportState, setExportState] = useState("Exporting");
    const [errMsg, setErrMsg] = useState("");

    const {nftContract, nftInfo, tokenAddress, tokenId} = useNftFromSecret(secret);

    return (
        <div className={"flex flex-col gap-1 text-white"}>
            <div className={"flex flex-row justify-between pb-1 text-white"}>
                <div>
                    <AlertButton onClick={() => {
                        removeAsset!(idx);
                    }}>
                        Delete
                    </AlertButton>
                </div>
                <div className={"flex justify-center text-center"}>
                    <label><b>
                        {nftInfo?.name ? (highlighted ? exportState + " " + nftInfo?.name : nftInfo?.name) : "Loading NFT"}
                    </b></label>
                </div>
                <div className={"flex justify-end"}>
                    {highlighted ? ((exportState == "Exporting") && <SecondaryButton onClick={() => {
                        setAssetSel(-1);
                    }}>
                        Cancel
                    </SecondaryButton>) : <PrimaryButton onClick={() => {
                        setAssetSel(idx);
                    }}>
                        Export
                    </PrimaryButton>}
                </div>
            </div>
            {nftInfo?.image ?
                <img className="rounded-md" alt={nftInfo.title} src={nftInfo.image} width={600}/>
                : <img className="rounded-md" alt={"Loading NFT Image"} src={"loading.jpg"} width={600}/>
            }
            {highlighted && <div className={"flex flex-row gap-1 text-white pt-1"}>
                {((exportState == "Exporting") || (exportState == "Withdrawing")) &&
                    <WithdrawSection idx={idx} rm={removeAsset} setAssetSel={setAssetSel} setErrMsg={setErrMsg}
                                     setExportState={setExportState}/>
                }
                {((exportState == "Exporting") || (exportState == "Transferring")) &&
                    <TransferSection idx={idx} rm={removeAsset} setAssetSel={setAssetSel} setErrMsg={setErrMsg}
                                     setExportState={setExportState}/>
                }
                {(exportState == "Exporting") && <>
                    <div className={"pr-2"}>
                        <PrimaryButton onClick={() => {
                            // Remove the secret
                            console.log("i am the secret", secret);
                            setEnableExporting(!enableExporting);
                            if (enableExporting) {
                                navigator.clipboard.writeText(secret.secret!.toHexString());
                            }
                            return (<div></div>);
                        }}>
                            {enableExporting ? "Export Secret" : "Copy"}
                        </PrimaryButton>
                    </div>
                    {!enableExporting && <span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
             			{secret.secret!.toHexString().substr(0, 10) + "..."}
            		</span>}
                </>}
            </div>}
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
    const [assetSel, setAssetSel] = useState(-1);

    return (
        <div className={"h-full"}>
            {
                assets.length == 0 ? (
                    <div className={"text-center my-auto"}>
                        You will find your assets here once you deposit into Hurricane.
                    </div>
                ) : <> {(assetSel == -1) ?
                    <div className={"grid grid-cols-8 gap-2"}>
                        <div className={"col-span-6"}>
                            <h3 className={"text-lg text-black font-bold"}>
                                YOUR ASSETS
                            </h3>
                        </div>
                        <PrimaryButton onClick={() => {
                            setAssetStart(assetStart - 2);
                        }} disabled={assetStart == 0}>
                            Back
                        </PrimaryButton>
                        <PrimaryButton onClick={() => {
                            setAssetStart(assetStart + 2);
                        }} disabled={assetStart + 3 > assets.length}>
                            Next
                        </PrimaryButton>
                    </div> : <></>}
                    {(assetSel == -1) ? <div className={"grid grid-cols-2 gap-2 pt-2 h-full basis-full"}>
                        {
                            assets.slice(assetStart, assetStart + 2).map(function (secret, idx) {
                                return (
                                    <div key={secret.shared.toString()} className={"bg-stone-800 p-2 rounded-lg h-fit"}>
                                        <div className="flex flex-row justify-between">
                                            {/*<span className={"text-white"}></span>*/}
                                            <AssetDisplay secret={secret} idx={idx + assetStart}
                                                          setAssetSel={setAssetSel} highlighted={false}/>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div> : <div>
                        <div className="bg-stone-800 p-2 rounded-lg h-fit">
                            <AssetDisplay secret={assets[assetSel]} idx={assetSel} setAssetSel={setAssetSel}
                                          highlighted={true}/>
                        </div>
                    </div>}
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
            <div className="bg-darkgreen p-2 rounded-lg h-full">
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
