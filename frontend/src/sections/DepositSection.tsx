import React, {useContext, useEffect, useRef, useState} from "react";
import SecretContext, {generateSecret, maskTokenData, Secret} from "../contexts/SecretContext";
import {useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {
    HURRICANE_CONTRACT_ABI,
    HURRICANE_CONTRACT_ADDRESSES,
    NFT_ABI,
} from "../contracts/deployInfo";
import InlineLoader from "../components/InlineLoader";
import NFTSection from "./NFTSection";
import {NFTContext} from "../contexts/NFTContext";

export function DepositSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const [isApproving, setIsApproving] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);
    const [depositErrMsg, setDepositErrMsg] = useState("");

    const [nftIdx, setNftIdx] = useState<number>(-1);

    const {addAsset, assets, removeAsset} = useContext(SecretContext);

    const {nfts, refreshNFTs} = useContext(NFTContext);

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
		const add_position = assets.length;
        addAsset!(secret);
        const result = await tx.wait().catch((resErr: any) => {
            console.log("txWaitErr", resErr);
            setIsDepositing(false);
            setDepositErrMsg("Deposit failed");
			removeAsset!(secret);
        });
        if (!result?.status) {
            setDepositErrMsg("Deposit failed");
			removeAsset!(secret);
        } else {
            setNftIdx(-1);
        }
        console.log("deposit result:", result);
        setIsPreparingTxn(false);
        setIsDepositing(false);
        refreshNFTs().then();
    }

    return (
        <div>
            <h3 className={"text-lg text-lightgreen font-bold mb-2"}>
                DEPOSIT
            </h3>
            <div>
                <div className="flex flex-col items-center gap-1">
                    <PrimaryButton onClick={async () => {
                        // first, generate
                        if (isApproved) {
                            console.log("Generating Secret");
                            const secret = generateSecret();
                            console.log("nft", nft);
                            await makeDeposit(secret, nftAddress, nftId);
                        } else {
                            approveNFT();
                        }
                    }} disabled={isDepositing || isApproving || nftIdx === -1}
                                   className={"w-full py-2"}
                    >
                        {nft ? (isApproved ? "Deposit " : "Approve ") + ` ${nft.title}` : 'Select an NFT'}
                    </PrimaryButton>
                    {isDepositing ? (isPreparingTxn ? (
                        <span className={"text-lightgreen"}>
                            Preparing transaction <InlineLoader/>
                        </span>
                    ) : (
                        <span className={"text-lightgreen"}>
                            Depositing <InlineLoader/>
                        </span>
                    )) : (
                        isApproving && (
                            <span className={"text-lightgreen"}>
                                Approving <InlineLoader/>
                            </span>
                        )
                    )}
                </div>
                <div className="pt-2">
                    <NFTSection nftIdx={nftIdx} setNftIdx={setNftIdx}/>
                </div>
            </div>
        </div>
    )
}
