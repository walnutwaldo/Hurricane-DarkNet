// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
import React, {useCallback, useContext, useRef} from "react";
import {useEffect, useState} from "react";
import InlineLoaderFast from "../components/InlineLoaderFast";
import {PrimaryButton} from "../components/buttons";
import {NFTDisplay} from "../components/NFTDisplay";
import {NFTContext} from "../contexts/NFTContext";

const PAGE_SIZE = 15;

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
                    !loadingNFTs && (nfts.length > PAGE_SIZE) && <>
                        <PrimaryButton onClick={() => {
                            setNFTStart(nftStart - PAGE_SIZE);
                            setNftIdx(-1);
                        }} disabled={nftStart == 0}>
                            Back
                        </PrimaryButton>
                        <PrimaryButton onClick={() => {
                            setNFTStart(nftStart + PAGE_SIZE);
                            setNftIdx(-1);
                        }} disabled={nftStart + PAGE_SIZE > nfts.length}>
                            Next
                        </PrimaryButton>
                    </>
                }
            </div>
            <div className="overflow-x-scroll w-full pt-2 pb-4">
                {/*scrollbar scrollbar-thumb-rounded-md scrollbar-thumb-lightgreen scrollbar-track-gray-700*/}
                <div className={"flex flex-row gap-3 pt-2 pr-2"}>
                    {
                        nfts.slice(nftStart, nftStart + PAGE_SIZE).map((nft: any, idxOffset: number) => {
                            const idx = idxOffset + nftStart;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setNftIdx(idx);
                                    }}
                                    disabled={nftIdx == idx}
                                    className={
                                        "rounded-md shrink-0 w-1/5" +
                                        " " +
                                        (nftIdx === idx ? "border-lightgreen shadow-md" : "hover:scale-95") +
                                        " " +
                                        (nftIdx !== -1 && (nftIdx !== idx) && "opacity-75")
                                        // + " " +
                                        // ((idx < nftStart || idx >= nftStart + PAGE_SIZE) ? "hidden" : "")
                                    }
                                >
                                    <NFTDisplay nft={nft}/>
                                </button>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}
