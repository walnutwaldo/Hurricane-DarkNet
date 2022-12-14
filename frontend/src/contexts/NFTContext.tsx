import React, {createContext, useCallback, useEffect, useRef, useState} from "react";
import {useNetwork, useSigner} from "wagmi";
import {Alchemy, Network} from "alchemy-sdk";
import {ethers} from "ethers";
import {NFT_ABI} from "../contracts/deployInfo";

type NFTContext = {
    nfts: any[],
    refreshNFTs: () => Promise<void>,
    loadingNFTs: boolean
}

export const NFTContext = createContext<NFTContext>({
    nfts: [],
    refreshNFTs: () => Promise.resolve(),
    loadingNFTs: false
});

const NETWORK_TO_CHAIN = {
    'goerli': Network.ETH_GOERLI,
    "ethereum": Network.ETH_MAINNET
}

const NFT_ADDRESS_HARDCODED = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

export function useAlchemy() {
    const {chain} = useNetwork()
    const networkName = chain && chain.name && chain.name.toLowerCase();

    const settings = (networkName && networkName !== 'localhost') ? {
        apiKey: process.env.ALCHEMY_KEY,
        network: NETWORK_TO_CHAIN[networkName]
    } : undefined;
    return settings && new Alchemy(settings);
}

export function cleanupAlchemyMetadata(nft: any, alchemy: Alchemy) {
    if (nft.title) {
        return Promise.resolve(nft);
    } else {
        const uri = nft.tokenUri.raw;
        return fetch(uri).then(x => x.json()).then((fetchRes) => {
            nft.title = fetchRes.name;
            nft.media = [{
                raw: fetchRes.image_url
            }];
            return nft;
        });
    }
}

export default function NFTProvider(props: any) {
    const {children} = props;
    const [nfts, setNFTs] = useState<any[]>([]);

    const {data: signer} = useSigner();
    const {chain} = useNetwork()
    const networkName = chain && chain.name && chain.name.toLowerCase();

    const [loadingNFTs, setLoadingNFTs] = useState(true);

    const lastSigner = useRef<string>("");

    const alchemy = useAlchemy();

    const refreshNFTs = useCallback(async () => {
        if (signer && networkName) {
            setNFTs([]);
            setLoadingNFTs(true);
            if (NETWORK_TO_CHAIN[networkName]) {
                // Print all NFTs returned in the response:
                signer.getAddress().then(addr => alchemy!.nft.getNftsForOwner(addr).then(async (res: any) => {
                    const nfts = res.ownedNfts;
                    const updatedNFTs = [
                        ...nfts.map((nft: any) => cleanupAlchemyMetadata(nft, alchemy!))
                    ]
                    await Promise.all(updatedNFTs).then(allNFTs => {
                        setNFTs(allNFTs);
                        console.log(allNFTs);
                        // console.log(JSON.stringify(res));
                        setLoadingNFTs(false);
                    });
                }));
            } else {
                const contract = new ethers.Contract(NFT_ADDRESS_HARDCODED, NFT_ABI, signer);
                const signerAddress = await signer.getAddress();
                const arr = [];
                for (let i = 0; i < 5; i++) {
                    const owner = (await contract.ownerOf(i.toString()).catch(() => ethers.constants.AddressZero));
                    console.log("owner of ", i, ": ", owner);
                    if (owner === signerAddress) {
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
                }
                setNFTs(arr);
            }
            setLoadingNFTs(false);
        }
    }, [signer, networkName]);

    const autoRefreshNFTs = useCallback(async () => {
        if (signer && networkName) {
            const signerAddr = await signer.getAddress();
            if (signerAddr !== lastSigner.current) {
                lastSigner.current = signerAddr;
                refreshNFTs().then();
            } else {
                return;
            }

        }
    }, [signer, networkName, refreshNFTs]);

    useEffect(() => {
        autoRefreshNFTs().then();
    }, [autoRefreshNFTs]);

    // console.log("nfts", nfts);

    return (
        <NFTContext.Provider value={{
            nfts,
            refreshNFTs,
            loadingNFTs
        }}>
            {children}
        </NFTContext.Provider>
    );
}
