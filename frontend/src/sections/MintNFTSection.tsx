import {BigNumber, Contract} from "ethers";
import {useNetwork, useSigner} from "wagmi";
import {SAD_ABI} from "../contracts/deployInfo";
import InlineLoader from "../components/InlineLoader";
import React, {useContext, useEffect, useRef, useState} from "react";
import {PrimaryButton} from "../components/buttons";
import { setDefaultResultOrder } from "dns";

export function MintSection (){
    // Goerli Address: 0x6fcf2F9f82f2036FD14B01c98Df32a69Dd4ba58D
    const shRef = useRef<HTMLInputElement>(null);
    const NFT_ADDRESS = "0x6fcf2F9f82f2036FD14B01c98Df32a69Dd4ba58D";
    const {data: signer, isError, isLoading} = useSigner();
    const USER_ADDRESS = signer?.getAddress();
    const [mintFailed, setMintFailed] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    
    async function mint(ID : string) {
        const contract = new Contract(NFT_ADDRESS, SAD_ABI, signer!);
        const contractAddress = contract.address;
        console.log(`Attached to NFT at ${contractAddress}`);
        let NFT_ID = ID === "-1" ? (Math.floor(Math.random()*10000)).toString() : ID;
        console.log(`Minting NFT ${NFT_ID}`);
        await contract.unsafeMint(
            USER_ADDRESS,
            BigNumber.from(NFT_ID),
            {
                gasLimit: 10000000,
            }
        ).then(async (tx: any ) => {
            console.log("Signed txn");
            const res = await tx.wait();
            // console.log(res);
            if (res?.status) {
                const tokenId = res.events![0].args!.tokenId;
                console.log(`Minted token ${tokenId} to ${USER_ADDRESS}`);
            } else {
                console.log("Mint failed");
                setMintFailed(false);
            }
        });

    }
    return (
        <div>
            <h3 className={"text-lg text-lightgreen font-bold"}>
            </h3>
            <div>
                <div className="flex flex-row gap-2">
                <input
                       	type="text"
                      	name="sharedTextbox"
                        placeholder = "NFT ID"
                     	ref={shRef}
                     	className={"ml-1 w-1/5 rounded-md text-black outline-none bg-slate-100 px-1 mb-1"}
             		/>
                    <PrimaryButton onClick={async () => {
                        setIsMinting(true);
                        if (shRef.current){
                                try {
                                    mint(shRef.current.value.toString());
                                    setMintFailed(false);
                                } catch{
                                    setMintFailed(true);
                                }
                            } 
                        }
                    } disabled={false}>
                        Mint Selected NFT
                    </PrimaryButton>
                    <PrimaryButton onClick={async () => {
                        setIsMinting(true);
                        try{
                            mint("-1");
                            setMintFailed(false);
                        } catch{
                            setMintFailed(true);
                        }
                    }} disabled={false}>
                        Mint Random NFT
                    </PrimaryButton>
                    <span className={"text-lightgreen"}>
                        {isMinting && (
                            <span>
                                Minting <InlineLoader/>
                            </span>
                        )}
                    </span>
                </div>
                <div className="pt-2 text-lightgreen">
                    {mintFailed && 
                    <span> Try another NFT ID</span>}
                </div>
            </div>
        </div>
    )
}
export default MintSection;