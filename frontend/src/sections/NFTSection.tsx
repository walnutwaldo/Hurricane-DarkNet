// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
import { Network, Alchemy } from "alchemy-sdk";
import React from "react";
import {useEffect, useState} from "react";
import {useNetwork, useSigner} from "wagmi";

const NETWORK_TO_CHAIN = {
    'goerli': Network.ETH_GOERLI
}

export default function NFTSection() {
    const {data: signer} = useSigner();
    const {chain} = useNetwork()
    const networkName = chain && chain.name && chain.name.toLowerCase();

    const [nfts, setNFTs] = useState([]);

    useEffect(() => {
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
            }));
        }
    }, [signer]);

    return (
        <div>
            NFTs
        </div>
    )
}