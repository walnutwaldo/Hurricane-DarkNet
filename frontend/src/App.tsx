import './styles/App.css';
import Content from "./Content";
import React from 'react';
import {ConnectButton} from '@rainbow-me/rainbowkit';

function App() {
    return (
        <div className={"bg-zinc-200"}>
            <div className={"bg-zinc-900"}>
                <div className="container mx-auto py-3 flex flex-row justify-between">
                    <div className={"flex flex-col"}>
                        <div className={"flex flex-row gap-4"}>
                            <img alt={"logo"} src={"HurricaneNFTsLogo.png"} height={64} width={64}
                                 className={"rounded-lg"}>
                            </img>
                            <div className="flex flex-row gap-2 items-baseline my-auto">
                                <h1 className="text-3xl text-teal-200 font-bold line-through decoration-8 decoration-red-500">
                                    Hurricane
                                </h1>
                                <h2 className={"text-lg text-white font-mono"}>
                                    NFT DarkNet
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className={"my-auto"}>
                        <ConnectButton/>
                    </div>
                </div>
            </div>
            <div className={"container mx-auto py-4"}>
                <Content/>
            </div>
            <div className={"bg-teal-300 text-black"}>
                <div className="container mx-auto py-2">
                    <div className="flex flex-row justify-between">
                        <h1 className="text-md">
                            Built at <b>Hacklodge 2022</b>
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
