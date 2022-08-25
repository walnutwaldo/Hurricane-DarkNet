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
import {ConnectButton} from "@rainbow-me/rainbowkit";
import NFTSection from "./sections/NFTSection";

const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

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

function AssetDisplay(props: any) {
	console.log("Loading asset");
    const {removeAsset, updateStatus} = useContext(SecretContext);
    
    const {secret, idx} = props;
    
    const [enableSecretCopy, setEnableSecretCopy] = useState(true);
    const [enableExporting, setEnableExporting] = useState(true);

    return (
        <div className={"flex flex-row gap-3 text-white"}>
			<AlertButton onClick={() => {
				removeAsset!(idx);
			}}>
				Delete
			</AlertButton>
			<label><b>Your Asset Name</b></label>
            <WithdrawSection idx={idx} rm={removeAsset}/>
            <PrimaryButton onClick={() => {
                // Remove the secret
                console.log("i am the secret", secret);
                setEnableExporting(!enableExporting);
                if (enableExporting){
                    navigator.clipboard.writeText(secret.secret!.toHexString());
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
    const {keys, assets, updateStatus} = useContext(SecretContext);
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);
	
    return (
        <div>
			{
				assets.length == 0 ? "No assets entered!" : <>
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
                                   			<AssetDisplay secret={secret} idx={idx}/>
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

function YourKeysSection() {
    const {keys, assets, updateStatus} = useContext(SecretContext);
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);
	
	return (
		<div>
			{ keys.length == 0 ? "No outgoing requests." : <>
            	<h3 className={"text-lg text-black font-bold"}>
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

function GenerateSecretSection() {
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESS[chain.name.toLowerCase()] || "" : "";

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
				console.log("Generating");
                const randomBytes = crypto.getRandomValues(new Uint32Array(10));
                // Concatenate into hex string
                const secretString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
                const secret = BigNumber.from("0x" + secretString).mod(MODULUS);
				const leaf = mimc(secret, "0");
                const isPaid = await !((BigNumber.from(await contract.indexOfLeaf(leaf))).isZero());
                addKey!({
					secret: secret,
					shared: leaf,
				});
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

function DepositReceiveSection() {
	const [DRState, setDRState] = useState("");

	return (<div className="mb-3">
		<div className="grid grid-cols-4 gap-2">
			<PrimaryButton onClick={() => {
				setDRState("deposit");	
			}} disabled={DRState == "deposit"}>
				Deposit
			</PrimaryButton>
			<PrimaryButton onClick={() => {
				setDRState("receive");
			}} disabled={DRState == "receive"}>
				Receive
			</PrimaryButton>	
		</div>
		<div className="pt-6">
			{ 
				DRState == "" ? <></> : <div className="bg-cyan-800 p-2 rounded-lg">
					{
						DRState == "deposit" ? <DepositSection/> : <GenerateSecretSection/>
					}		
				</div>
			}
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
            {signer ? <div className="grid grid-cols-5 gap-8">
                <div className="col-span-3">
					<YourAssetsSection/>
				</div>
                <div className="col-span-2">
					<DepositReceiveSection/>
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
