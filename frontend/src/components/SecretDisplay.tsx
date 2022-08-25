import SecretContext, {Secret, secretToPrivateKey, secretToSharedKey, unmaskTokenData} from "../contexts/SecretContext";
import React, {useContext, useEffect, useState} from "react";
import {BigNumber} from "ethers";
import {AlertButton, SecondaryButton} from "./buttons";

export function SecretDisplay(
    props: {
        secret: Secret,
    } & any
) {

    const {removeAsset, removeKey, updateStatus} = useContext(SecretContext);

    const {secret, idx, upd, contract, isAsset} = props;

    const [enableSecretCopy, setEnableSecretCopy] = useState(isAsset);
    const [enableSharedCopy, setEnableSharedCopy] = useState(true);
    const [enableIsPaidCopy, setEnableIsPaidCopy] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    async function refresh() {
        if (isAsset) return;
        setRefreshing(true);
        const leafIdx = BigNumber.from(await contract.leafForPubkey(secret.shared));
        if (leafIdx.isZero()) {
            setRefreshing(false);
            return;
        }
        console.log("leafIdx", leafIdx);

        const maskedData = await contract.dataForPubkey(secret.shared);
        const {tokenAddress, tokenId} = unmaskTokenData(maskedData, secret);
        const leaf = await contract.calcLeaf(
            secret.shared,
            tokenAddress,
            tokenId,
            secret.noise
        );
        const isPaid = (await contract.getLeaf(leafIdx)).eq(leaf);
        if (isPaid) {
            updateStatus?.(idx);
        }
        setRefreshing(false);
    }

    useEffect(() => {
        if (contract) {
            refresh();
        }
    }, [])

    return (
        <div className={"flex flex-row gap-3 text-white"}>
            <AlertButton onClick={() => {
                {
                    isAsset ? removeAsset!(idx) : removeKey!(idx)
                }
                ;
            }}>
                Delete
            </AlertButton>
            <label><b>Secret key:</b></label>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(secretToPrivateKey(secret));
                setEnableSecretCopy(false);
                setTimeout(() => {
                    setEnableSecretCopy(true);
                }, 1000);
            }} disabled={!enableSecretCopy}>
                {enableSecretCopy || !isAsset ? "Copy" : "Copied!"}
            </SecondaryButton>
            <span className={"px-1 bg-zinc-400 text-zinc-900 rounded-md font-mono"}>
                {secretToPrivateKey(secret).substr(0, 6) + "..."}
            </span>
            {
                isAsset ? <></> : <>
                    <label><b>Shared key:</b></label>
                    <SecondaryButton onClick={() => {
                        // Copy secret.toHexString() to clipboard
                        navigator.clipboard.writeText(secretToSharedKey(secret));
                        setEnableSharedCopy(false);
                        setTimeout(() => {
                            setEnableSharedCopy(true);
                        }, 1000);
                    }} disabled={!enableSharedCopy}>
                        {enableSharedCopy ? "Copy" : "Copied!"}
                    </SecondaryButton>
                    <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                	{secretToSharedKey(secret).substr(0, 6) + "..."}
            	</span>
                    <label><b>Status:</b></label>
                    <SecondaryButton onClick={refresh} disabled={refreshing}>
                        Refresh
                    </SecondaryButton>
                    <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                	Unpaid
            	</span>
                </>
            }
        </div>
    )
}