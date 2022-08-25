import {BigNumber, Contract} from "ethers";
import {useEffect, useState} from "react";
import {useNetwork, useSigner} from "wagmi";
import {HURRICANE_CONTRACT_ABI, HURRICANE_CONTRACT_ADDRESSES, NFT_ABI} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import {unmaskTokenData} from "../contexts/SecretContext";

export function useNftFromSecret(secret: {
    secret: BigNumber,
    noise: BigNumber,
    tokenMask: BigNumber,
    tokenIdMask: BigNumber
} | undefined) {
    const [nftContract, setNftContract] = useState<Contract | undefined>(undefined);
    const [nftInfo, setNftInfo] = useState<any>(undefined);

    const {chain, chains} = useNetwork()
    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";
    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    useEffect(() => {
        if (secret) {
            const pubKey = mimc(secret.secret, "0");
            contract.dataForPubkey(pubKey).then((maskedData: [BigNumber, BigNumber]) => {
                const unmaskedData = unmaskTokenData(maskedData, secret);
                const nft = new Contract(unmaskedData.tokenAddress.toHexString(), NFT_ABI, signer!);
                setNftContract(nft);
                nft.tokenURI(unmaskedData.tokenId).then((tokenURI: any) => {
                    fetch(tokenURI).then(res=>res.json()).then((res: any) => {
                        setNftInfo(res);
                    });
                });
            })
        }
    }, [secret]);

    return [nftContract, nftInfo];
}