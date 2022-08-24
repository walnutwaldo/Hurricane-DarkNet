import './styles/App.css';
import Content from "./Content";
import React from 'react';
import {ConnectButton} from '@rainbow-me/rainbowkit';
import {useSigner} from "wagmi";

function App() {
    const {data: signer} = useSigner();

    return (
        <div className={"bg-stone-200 pt-4 flex flex-col h-full"}>
            <div className={"bg-stone-800 container mx-auto p-4 rounded-2xl"}>
                <div className="p-4 flex flex-row justify-between">
                    <div className={"flex flex-col"}>
                        <div className={"flex flex-row gap-4"}>
                            <img alt={"logo"} src={"HurricaneNFTsLogo.png"} height={196} width={196}
                                 className={"rounded-lg"}>
                            </img>
                            <div className="flex flex-col gap-4 items-baseline my-auto">
                                <h1 className="text-5xl text-teal-200 font-bold line-through decoration-8 decoration-red-500">
                                    Hurricane
                                </h1>
                                <h2 className={"text-lg text-white font-mono text-2xl courier-new"}>
                                    NFT DarkNet
                                </h2>
                            </div>
                        </div>
                    </div>
                    {signer && <div className={"mt-auto"}>
                        <ConnectButton/>
                    </div>}
                </div>
            </div>
            <div className={"container mx-auto py-4 flex-1"}>
                <Content/>
            </div>
            <div className={"bg-darkgreen text-white courier-new"}>
                <div className="container mx-auto pt-2 pb-4">
                    <div className="flex flex-row justify-between">
                        <h1 className="text-md">
                            Built at <b>Hacklodge 2022</b><br/>
                            <br/>
                            plz no US Sanctions
                        </h1>
                        <p className={"text-right"}>
                            Walden Yan<br/>
                            Allison Qi <br/>
                            Brandon Wang
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
