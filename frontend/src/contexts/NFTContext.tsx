import React, {createContext, useCallback, useEffect, useRef, useState} from "react";
import {useNetwork, useSigner} from "wagmi";
import {Alchemy, Network} from "alchemy-sdk";

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

const NFT_ADDRESS_HARDCODED = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

export default function NFTProvider(props: any) {
    const {children} = props;
    const [nfts, setNFTs] = useState<any[]>([]);

    const {data: signer} = useSigner();
    const {chain} = useNetwork()
    const networkName = chain && chain.name && chain.name.toLowerCase();

    const [loadingNFTs, setLoadingNFTs] = useState(true);

    const lastSigner = useRef<string>("");

    const refreshNFTs = useCallback(async () => {
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
                    // console.log(JSON.stringify(res));
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