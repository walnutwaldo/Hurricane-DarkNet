// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
import React, {useCallback, useContext, useRef} from "react";
import {useEffect, useState} from "react";
import InlineLoaderFast from "../components/InlineLoaderFast";
import {PrimaryButton} from "../components/buttons";
import {NFTDisplay} from "../components/NFTDisplay";
import {NFTContext} from "../contexts/NFTContext";

export default function NFTSection(props: any) {
    const {nfts, loadingNFTs} = useContext(NFTContext);

    const {nftIdx, setNftIdx} = props;

    const [nftStart, setNFTStart] = useState(0);

    return (
        <div>
            <div className={"flex flex-row gap-2 grid grid-cols-6"}>
                <div className="col-span-4">
            	<span className="text-lightgreen font-bold text-lg">
					{loadingNFTs ? <> Loading Your NFTs <InlineLoaderFast/></> : "Your NFTs"}
				</span>
                </div>
                {
                    loadingNFTs || <>
                        <PrimaryButton onClick={() => {
                            setNFTStart(nftStart - 3);
                            setNftIdx(-1);
                        }} disabled={nftStart == 0}>
                            Back
                        </PrimaryButton>
                        <PrimaryButton onClick={() => {
                            setNFTStart(nftStart + 3);
                            setNftIdx(-1);
                        }} disabled={nftStart + 4 > nfts.length}>
                            Next
                        </PrimaryButton>
                    </>
                }
            </div>
            <div className={"gap-2 grid grid-cols-3 pt-2"}>
                {
                    nfts.slice(nftStart, nftStart + 3).map((nft: any, idx: number) => {
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setNftIdx(idx + nftStart);
                                }}
                                disabled={nftIdx == idx + nftStart}
                                className={
                                    "rounded-md" +
                                    " " +
                                    (nftIdx === nftStart + idx ? "border-lightgreen shadow-md" : "hover:scale-105") +
                                    " " +
                                    (nftIdx !== -1 && (nftIdx !== nftStart + idx) && "opacity-75")
                                }
                            >
                                <NFTDisplay nft={nft}/>
                            </button>
                        )
                    })
                }
            </div>
        </div>
    )
}
