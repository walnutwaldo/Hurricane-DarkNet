// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
import {Network, Alchemy} from "alchemy-sdk";
import React from "react";
import {useEffect, useState} from "react";
import {useNetwork, useSigner} from "wagmi";
import InlineLoaderFast from "../components/InlineLoaderFast";
import {PrimaryButton} from "../components/buttons";
import {NFTDisplay} from "../components/NFTDisplay";
import {NFT_ADDRESS_HARDCODED, NFT_ID_HARDCODED} from "../contracts/deployInfo";

const NETWORK_TO_CHAIN = {
    'goerli': Network.ETH_GOERLI,
    "ethereum": Network.ETH_MAINNET
}

export default function NFTSection(props: any) {
    const {nftIdx, setNftIdx, nfts, setNFTs} = props;

    const {data: signer} = useSigner();
    const {chain} = useNetwork()
    const networkName = chain && chain.name && chain.name.toLowerCase();
    console.log("network name", networkName);

    const [loadingNFTs, setLoadingNFTs] = useState(true);
    const [nftStart, setNFTStart] = useState(0);

    useEffect(() => {
        if (signer && networkName) {
            setNFTs([]);
            setLoadingNFTs(true);
            if (NETWORK_TO_CHAIN[networkName]) {
                const settings = {
                    apiKey: process.env.ALCHEMY_KEY,
                    network: NETWORK_TO_CHAIN[networkName]
                };
                const alchemy = new Alchemy(settings);

                // Print all NFTs returned in the response:
                signer.getAddress().then(addr => alchemy.nft.getNftsForOwner(addr).then((res: any) => {
                    setNFTs(res.ownedNfts);
                    console.log(res);
                    setLoadingNFTs(false);
                }));
            } else {
                const arr = [];
                for (let i = 0; i < 5; i++) {
                    arr.push({
                        tokenId: i.toString(),
                        contract: {
                            address: NFT_ADDRESS_HARDCODED
                        },
                        title: "Fake Azuki #" + i,
                        media: [
                            {
                                gateway: `https://ikzttp.mypinata.cloud/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/${i}.png`
                            }
                        ]
                    })
                }
                setNFTs(arr);
            }
            setLoadingNFTs(false);
        }
    }, [signer, networkName]);

    return (
        <div>
            <div className={"flex flex-row gap-2 grid grid-cols-6"}>
                <div className="col-span-4">
            	<span className="text-lightgreen font-bold text-lg">
					{loadingNFTs ? <> Loading Your NFTs <InlineLoaderFast/></> : "Your NFTs"}
				</span>
                </div>
                {
                    loadingNFTs || <>
                        <PrimaryButton onClick={() => {
                            setNFTStart(nftStart - 3);
                            setNftIdx(-1);
                        }} disabled={nftStart == 0}>
                            Back
                        </PrimaryButton>
                        <PrimaryButton onClick={() => {
                            setNFTStart(nftStart + 3);
                            setNftIdx(-1);
                        }} disabled={nftStart + 4 > nfts.length}>
                            Next
                        </PrimaryButton>
                    </>
                }
            </div>
            <div className={"gap-2 grid grid-cols-3 pt-2"}>
                {
                    nfts.slice(nftStart, nftStart + 3).map((nft: any, idx: number) => {
                        return (
                            <button
                                onClick={() => {
                                    setNftIdx(idx + nftStart);
                                }}
                                disabled={nftIdx == idx + nftStart}
                                className={
                                    "rounded-md" +
                                    " " +
                                    (nftIdx === nftStart + idx ? "border-lightgreen shadow-md" : "hover:scale-105") +
                                    " " +
                                    (nftIdx !== -1 && (nftIdx !== nftStart + idx) && "opacity-75")
                                }
                            >
                                <NFTDisplay nft={nft}/>
                            </button>
                        )
                    })
                }
            </div>
        </div>
    )
}
