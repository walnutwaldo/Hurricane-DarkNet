import React, {useContext, useEffect, useRef, useState} from "react";
import SecretContext, {generateSecret, maskTokenData, Secret} from "../contexts/SecretContext";
import {useContractRead, useNetwork, useSigner} from "wagmi";
import {BigNumber, Contract, ethers} from "ethers";
import {PrimaryButton} from "../components/buttons";
import {
    HURRICANE_CONTRACT_ABI,
    HURRICANE_CONTRACT_ADDRESSES,
    NFT_ABI,
    NFT_ADDRESS_HARDCODED, NFT_ID_HARDCODED
} from "../contracts/deployInfo";
import mimc from "../crypto/mimc";
import InlineLoader from "../components/InlineLoader";

// @ts-ignore
const {groth16, zKey} = snarkjs;

export function DepositSection() {
    const {chain, chains} = useNetwork()

    const contractAddress = (chain && chain.name) ? HURRICANE_CONTRACT_ADDRESSES[chain.name.toLowerCase()] || "" : "";

    console.log("chain name", chain?.name);

    const {data: signer, isError, isLoading} = useSigner()
    const contract = new Contract(contractAddress, HURRICANE_CONTRACT_ABI, signer!);

    const shRef = useRef<HTMLInputElement>(null);

    const [isDepositing, setIsDepositing] = useState(false);
    const [isPreparingTxn, setIsPreparingTxn] = useState(false);
    const [depositErrMsg, setDepositErrMsg] = useState("");

    const {addAsset} = useContext(SecretContext);

    const nft = new Contract(NFT_ADDRESS_HARDCODED, NFT_ABI, signer!);
    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        nft.getApproved(NFT_ID_HARDCODED).then((approved: any) => {
            console.log("approved address:", approved);
            setIsApproved(approved === contractAddress);
        });
    }, [])

    async function approveNFT() {
        const approvalTx = await nft.approve(contractAddress, NFT_ID_HARDCODED);
        console.log("approval tx", approvalTx);
        const approveResult = await approvalTx.wait();
        console.log("approval result", approveResult);

        if (!approveResult.status) {
            setDepositErrMsg("Approval failed");
            return;
        } else {
            setIsApproved(true);
        }
    }

    async function makeDeposit(
        secret: Secret,
        tokenAddress: string,
        tokenId: BigNumber | string
    ) {
        setIsDepositing(true);
        setIsPreparingTxn(true);
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
            secret.noise
        ).catch((err: any) => {
            console.log(err);
            setIsDepositing(false);
            setIsPreparingTxn(false);
        });
        console.log("deposit tx:", tx);
        setIsPreparingTxn(false);
        const result = await tx.wait();
        if (!result.status) {
            setDepositErrMsg("Deposit failed");
        }
        console.log("deposit result:", result);
        setIsDepositing(false);
    }

    return (
        <div className={"mb-3"}>
            <h3 className={"text-lg text-black font-bold"}>
                DEPOSIT
            </h3>
            <div>
                <div className="flex flex-row gap-2">
                    <PrimaryButton onClick={async () => {
                        // first, generate
                        if (isApproved) {
                            console.log("Generating Secret");
                            const secret = generateSecret();
                            const nftAddress = NFT_ADDRESS_HARDCODED;
                            const nftId = NFT_ID_HARDCODED;
                            await makeDeposit(secret, nftAddress, nftId);
                            addAsset!(secret);
                        } else {
                            approveNFT();
                        }
                    }} disabled={isDepositing}>
                        {isApproved ? "Deposit NFT" : "Approve NFT"}
                    </PrimaryButton>
                    {isDepositing && (isPreparingTxn ? (
                        <span>
                            Preparing transaction <InlineLoader/>
                        </span>
                    ) : (
                        <span>
                            Depositing <InlineLoader/>
                        </span>
                    ))}
                </div>
                <div className={"text-red-500"}>{depositErrMsg}</div>
            </div>
        </div>
    )
}
