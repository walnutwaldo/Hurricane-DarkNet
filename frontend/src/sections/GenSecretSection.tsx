import {useNetwork, useSigner} from "wagmi";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES} from "../contracts/deployInfo";
import {Contract} from "ethers";
import React, {useContext, useState} from "react";
import SecretContext, {generateSecret, Secret} from "../contexts/SecretContext";
import {PrimaryButton} from "../components/buttons";

export function GenerateSecretSection() {
    const {chain} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const {data: signer} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const {addKey} = useContext(SecretContext);
    const [enableCopy, setEnableCopy] = useState(true);

    return (<div className={"mb-3"}>
        <h3 className={"text-lg text-black font-bold"}>
            GENERATE A SECRET
        </h3>
        <div className="flex flex-row gap-2">
            <PrimaryButton onClick={() => {
                addKey!(generateSecret());
            }}>
                Generate
            </PrimaryButton>
        </div>
    </div>)
}