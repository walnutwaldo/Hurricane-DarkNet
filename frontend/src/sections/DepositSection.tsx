import React, {useContext, useEffect, useRef, useState} from "react";
import SecretContext, {generateSecret, maskTokenData, Secret} from "../contexts/SecretContext";
import {useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {
    HURRICANE_CONTRACT_ABI,
    HURRICANE_CONTRACT_ADDRESSES,
    NFT_ABI,
    NFT_ADDRESS_HARDCODED, NFT_ID_HARDCODED
} from "../contracts/deployInfo";
import InlineLoader from "../components/InlineLoader";
import NFTSection from "./NFTSection";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function DepositSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);
    const shRef = useRef<HTMLInputElement>(null);

    const [isApproving, setIsApproving] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);
    const [depositErrMsg, setDepositErrMsg] = useState("");

    const [nfts, setNFTs] = useState([]);
    const [nftIdx, setNftIdx] = useState<number>(-1);

    const {addAsset} = useContext(SecretContext);

    const nft: any = nftIdx === -1 ? undefined : nfts[nftIdx];

    const nftAddress = nft?.contract?.address;
    const nftId = nft?.tokenId;

    const nftContract = nft ? new Contract(nftAddress, NFT_ABI, signer!) : undefined;
    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        if (nftContract) {
            nftContract.getApproved(nft.tokenId).then((approved: any) => {
                console.log("approved address:", approved);
                setIsApproved(approved === contractAddress);
            });
        }
    }, [nft])

    async function approveNFT() {
        if (!nft) return;
        setIsApproving(true);
        const approvalTx = await nftContract!.approve(contractAddress, nftId).catch(console.log);
        console.log("approval tx", approvalTx);
        if (approvalTx) {
            const approveResult = await approvalTx.wait().catch(console.log);
            console.log("approval result", approveResult);

            if (!approveResult?.status) {
                setDepositErrMsg("Approval failed");
            } else {
                setIsApproved(true);
            }
        }
        setIsApproving(false);
    }

    async function makeDeposit(
        secret: Secret,
        tokenAddress: string,
        tokenId: BigNumber | string
    ) {
        setIsDepositing(true);
        setIsPreparingTxn(true);
        setDepositErrMsg("");
        tokenId = BigNumber.from(tokenId);

        const tx = await contract.deposit(
            secret.shared,
            tokenAddress,
            tokenId,
            maskTokenData(
                tokenAddress,
                tokenId,
                secret
            ),
            secret.noise,
            {
                gasLimit: 10000000
            }
        ).catch((err: any) => {
            console.log("txErr", err);
            setIsDepositing(false);
            setIsPreparingTxn(false);
        });
        console.log("deposit tx:", tx);
        setIsPreparingTxn(false);
        const result = await tx.wait().catch((resErr: any) => {
            console.log("txWaitErr", resErr);
            setIsDepositing(false);
            setDepositErrMsg("Deposit failed");
        });
        if (!result?.status) {
            setDepositErrMsg("Deposit failed");
        }
        console.log("deposit result:", result);
        setIsPreparingTxn(false);
        setIsDepositing(false);
    }

    return (
        <div>
            <h3 className={"text-lg text-lightgreen font-bold"}>
                DEPOSIT
            </h3>
            <div>
                <div className="flex flex-row gap-2">
                    <PrimaryButton onClick={async () => {
                        // first, generate
                        if (isApproved) {
                            console.log("Generating Secret");
                            const secret = generateSecret();
                            console.log("nft", nft);
                            await makeDeposit(secret, nftAddress, nftId);
                            addAsset!(secret);
                        } else {
                            approveNFT();
                        }
                    }} disabled={isDepositing || isApproving || nftIdx === -1}>
                        {nft ? (isApproved ? "Deposit " : "Approve ") + ` ${nft.title}` : 'Select an NFT'}
                    </PrimaryButton>
                    <span className={"text-lightgreen"}>
                        {isDepositing ? (isPreparingTxn ? (
                            <span>
                                Preparing transaction <InlineLoader/>
                            </span>
                        ) : (
                            <span>
                                Depositing <InlineLoader/>
                            </span>
                        )) : (
                            isApproving && (
                                <span>
                                    Approving <InlineLoader/>
                                </span>
                            )
                        )}
                    </span>
                </div>
                <div className="pt-2">
                    <NFTSection nftIdx={nftIdx} setNftIdx={setNftIdx} nfts={nfts} setNFTs={setNFTs}/>
                </div>
            </div>
        </div>
    )
}
