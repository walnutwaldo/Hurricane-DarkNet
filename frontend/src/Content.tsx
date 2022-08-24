import React, {useContext, useReducer, useState} from 'react';
import {BigNumber, Contract} from "ethers";
import SecretContext, {Secret} from './contexts/SecretContext';
import {PrimaryButton, SecondaryButton, AlertButton} from "./components/buttons";
import {DepositSection} from "./sections/DepositSection";
import {WithdrawSection} from "./sections/WithdrawSection";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESS} from "./contracts/deployInfo";
import {useSigner, useNetwork} from "wagmi";
import mimc from "./crypto/mimc";
import {TransferSection} from "./sections/TransferSection";
import {ConnectButton} from "@rainbow-me/rainbowkit";

const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

function SecretDisplay(props: any) {
    const {removeAsset, removeKey, updateStatus} = useContext(SecretContext);
    
    const {secret, idx, upd, contract, isAsset} = props;
    
    const [enableSecretCopy, setEnableSecretCopy] = useState(isAsset);
	const [enableSharedCopy, setEnableSharedCopy] = useState(true);
    const [enableIsPaidCopy, setEnableIsPaidCopy] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

    return (
        <div className={"flex flex-row gap-3 text-white"}>
			<AlertButton onClick={() => {
				{isAsset ? removeAsset!(idx) : removeKey!(idx)};
			}}>
				Delete
			</AlertButton>
			<label><b>Secret key:</b></label>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(secret.secret!.toHexString());
                setEnableSecretCopy(false);
                setTimeout(() => {
                    setEnableSecretCopy(true);
                }, 1000);
            }} disabled={!enableSecretCopy}>
                {enableSecretCopy || !isAsset ? "Copy" : "Copied!"}
            </SecondaryButton>
            {	
				isAsset ? 	<   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                	{secret.secret.toHexString().substr(0,6) + "..."}
            	</span> : <   span className={"px-1 bg-zinc-400 text-zinc-900 rounded-md font-mono"}>
                	{secret.secret.toHexString().substr(0,6) + "..."}
				</span>
			}
            {
				isAsset ? <></> : <>
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
					upd(idx);
					setRefreshing(false);
            	}} disabled={refreshing}>
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
    const {keys, assets, updateStatus} = useContext(SecretContext);
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

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
									console.log("Secret", idx, secret);
                        			return (
                            			<div key={idx} className={"bg-stone-800 p-2 rounded-lg"}>
                               				<div className="flex flex-row justify-between">
                                   				{/*<span className={"text-white"}></span>*/}
                                   				<SecretDisplay secret={secret} idx={idx} upd={updateStatus} contract={contract} isAsset={true}/>
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
									console.log("Secret", idx, secret);
                        			return (
                            			<div key={idx} className={"bg-stone-800 p-2 rounded-lg"}>
                               				<div className="flex flex-row justify-between">
                                   				{/*<span className={"text-white"}></span>*/}
                                   				<SecretDisplay secret={secret} idx={idx} upd={updateStatus} contract={contract} isAsset={false}/>
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

function GenerateSecretSection() {
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);
    
    const {addKey} = useContext(SecretContext);
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
				console.log(leaf, await contract.indexOfLeaf(leaf));
                const isPaid = await !((BigNumber.from(await contract.indexOfLeaf(leaf))).isZero());
                addKey!({
					secret: secret,
					shared: leaf,
				});
			}}>
                Generate 
            </PrimaryButton>
        </div>
    </div>)
}

const KEYS_LOCALHOST_KEY = 'hurricane_keys';
const ASSETS_LOCALHOST_KEY = 'hurricane_assets';

export default function Content() {
    const {data: signer, isError, isLoading} = useSigner();
    console.log("signer", signer);

    const [keys, setKeys] = useState(
        JSON.parse(localStorage.getItem(KEYS_LOCALHOST_KEY) || '[]').map((keyJson: any) => ({
            secret: BigNumber.from(keyJson.secret),
            shared: BigNumber.from(keyJson.shared),
        }))
    );

    function saveKeys(newKeys: Secret[]) {
        localStorage.setItem(KEYS_LOCALHOST_KEY, JSON.stringify(
            newKeys.map((secret) => ({
                secret: secret.secret.toString(),
                shared: secret.shared.toString(),
            }))
        ));
    }

    const [assets, setAssets] = useState(
        JSON.parse(localStorage.getItem(ASSETS_LOCALHOST_KEY) || '[]').map((assetJson: any) => ({
            secret: BigNumber.from(assetJson.secret),
            shared: BigNumber.from(assetJson.shared),
        }))
    );

    function saveAssets(newAssets: Secret[]) {
        localStorage.setItem(ASSETS_LOCALHOST_KEY, JSON.stringify(
            newAssets.map((secret) => ({
                secret: secret.secret.toString(),
                shared: secret.shared.toString(),
            }))
        ));
    }

    function addKey(newKey: Secret, ) {
        const newKeys = [...keys, newKey];
        saveKeys(newKeys);
        setKeys(newKeys);
    }

    function addAsset(newAsset: Secret, ) {
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
