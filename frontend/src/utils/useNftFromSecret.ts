import {BigNumber, Contract} from "ethers";
import {useCallback, useEffect, useState} from "react";
import {useNetwork, useSigner} from "wagmi";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES, NFT_ABI} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import {unmaskTokenData} from "../contexts/SecretContext";
import {cleanupAlchemyMetadata, useAlchemy} from "../contexts/NFTContext";
import {hexZeroPad} from "ethers/lib/utils";

export function useNftFromSecret(secret: {
    secret: BigNumber,
    noise: BigNumber,
    tokenMask: BigNumber,
    tokenIdMask: BigNumber
} | undefined) {
    const [nftContract, setNftContract] = useState<Contract | undefined>(undefined);
    const [nftInfo, setNftInfo] = useState<any>(undefined);
    const [tokenAddress, setTokenAddress] = useState<string | undefined>(undefined);
    const [tokenId, setTokenId] = useState<BigNumber | undefined>(undefined);

    const {chain, chains} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";
    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const alchemy = useAlchemy();

    const refresh = useCallback(() => {
        if (secret) {
            const pubKey = mimc(secret.secret, "0");
            contract.dataForPubkey(pubKey).then((maskedData: [BigNumber, BigNumber]) => {
                console.log("maskedData", maskedData);
                const unmaskedData = unmaskTokenData(maskedData, secret);
                setTokenAddress(unmaskedData.tokenAddress);
                setTokenId(unmaskedData.tokenId);

                const nft = new Contract(unmaskedData.tokenAddress, NFT_ABI, signer!);
                setNftContract(nft);

                if (alchemy) {
                    alchemy.nft.getNftMetadata(
                        unmaskedData.tokenAddress,
                        unmaskedData.tokenId.toString()
                    ).then((nft) => cleanupAlchemyMetadata(nft, alchemy)).then((nft) => {
                        setNftInfo(nft);
                    });
                } else {
                    nft.tokenURI(unmaskedData.tokenId).then((tokenURI: any) => {
                        fetch(tokenURI).then(res => res.json()).then((res: any) => {
                            setNftInfo({
                                contract: {
                                    address: unmaskedData.tokenAddress,
                                },
                                tokenId: unmaskedData.tokenId.toString(),
                                tokenURI: {
                                    raw: tokenURI
                                },
                                media: [{
                                    raw: res.image
                                }],
                                title: res.name
                            });
                        });
                    });
                }
            })
        }
    }, [secret])

    useEffect(() => {
        refresh()
    }, [secret]);

    return { nftContract, nftInfo, tokenAddress, tokenId, refresh };
}