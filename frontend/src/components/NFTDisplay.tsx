import React from "react";

export function NFTDisplay(props: any) {
    const {nft} = props;

    const url = nft.media[0]?.gateway || nft.media[0]?.raw || "";

    return (
        <div className={
            "p-2 rounded-md" +
            " outline-none bg-stone-200 text-darkgreen rounded-md p-2 transition font-bold"
        }>
            <h4>{nft.title}</h4>
            <div className={"pb-1"}>
                <img className="rounded-md" alt={nft.title} src={url} width={300}/>
            </div>
        </div>
    )
}
