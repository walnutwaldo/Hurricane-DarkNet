import React from "react";

export function NFTDisplay(props: any) {
    const {nft} = props;
    return (
        <div className={
            "p-2 rounded-md" +
            " outline-none bg-stone-200 text-darkgreen rounded-md p-2 transition font-bold"
        }>
            <h4>{nft.title}</h4>
            <div className={"pb-1"}>
                <img className="rounded-md" alt={nft.title} src={nft.media[0].gateway} width={250}/>
            </div>
        </div>
    )
}