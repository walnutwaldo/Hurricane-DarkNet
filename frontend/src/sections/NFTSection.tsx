// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
import {Network, Alchemy} from "alchemy-sdk";
import React from "react";
import {useEffect, useState} from "react";
import {useNetwork, useSigner} from "wagmi";
import InlineLoaderFast from "../components/InlineLoaderFast";
import {PrimaryButton, NFTButtonActive, NFTButtonInactive} from "../components/buttons";

const NETWORK_TO_CHAIN = {
    'goerli': Network.ETH_GOERLI,
    "ethereum": Network.ETH_MAINNET
}

export default function NFTSection() {
    const {data: signer} = useSigner();
    const {chain} = useNetwork()
    const networkName = chain && chain.name && chain.name.toLowerCase();
    console.log("network name", networkName);

    const [nfts, setNFTs] = useState([]);
	const [loadingNFTs, setLoadingNFTs] = useState(false);
	const [nftStart, setNFTStart] = useState(0);
	const [nftSel, setNFTSel] = useState(-1);

    useEffect(() => {
		setLoadingNFTs(true);
		setNFTs([]);
        if (signer && networkName && NETWORK_TO_CHAIN[networkName]) {
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
        }
    }, [signer, networkName]);

    return (
		<div>
        <div className={"flex flex-row gap-2 grid grid-cols-6"}>
			<div className="col-span-4">
            	<span className="text-cyan-100 font-bold text-lg">
					{loadingNFTs ? <> Loading Your NFTs <InlineLoaderFast/></>: "Your NFTs"}
				</span>
			</div>
			{
				loadingNFTs || <> 
				<PrimaryButton onClick={() => {
					setNFTStart(nftStart-3);
					setNFTSel(-1);
				}} disabled={nftStart == 0}>
					Back
				</PrimaryButton>		
				<PrimaryButton onClick={() => {
					setNFTStart(nftStart+3);
					setNFTSel(-1);
				}} disabled={nftStart+4 > nfts.length}>
					Next
				</PrimaryButton>
				</>		
			}
       </div>
       <div className={"gap-2 grid grid-cols-3 pt-2"}>
			   {
					nftSel == -1 ? nfts.slice(nftStart, nftStart+3).map((nft: any, idx: number) => {
                    	return (
                        	<NFTButtonActive className={"p-2 rounded-md"} onClick={() => {
								setNFTSel(idx+nftStart);
							}} disabled={nftSel==idx+nftStart}>
                            	<h4>{nft.title}</h4>
								<div className={"pb-1"}>
                            		<img alt={nft.title} src={nft.media[0].gateway} width={250}/>
								</div>
                        	</NFTButtonActive>
						)
                	}) : nfts.slice(nftStart, nftStart+3).map((nft: any, idx: number) => {
                    	return (
                        	<NFTButtonInactive className={"p-2 rounded-md"} onClick={() => {
								setNFTSel(idx+nftStart);
							}} disabled={nftSel==idx+nftStart}>
                            	<h4>{nft.title}</h4>
								<div className={"pb-1"}>
                            		<img alt={nft.title} src={nft.media[0].gateway} width={250}/>
								</div>
                        	</NFTButtonInactive>
						)
					})
				}
        </div>
		</div>
    )
}
