import './styles/App.css';
import Content from "./Content";
import React from 'react';

function App() {
    return (
        <div>
            <div className={"bg-cyan-900"}>
                <div className="container mx-auto py-2">
                    <h1 className="text-xl text-white font-bold">
                        zkNFTs
                    </h1>
                </div>
            </div>
            <div className={"container mx-auto py-4"}>
                <Content/>
            </div>
            <div className={"bg-cyan-900"}>
                <div className="container mx-auto py-2">
                    <div className="flex flex-row justify-between text-white">
                        <h1 className="text-md">
                            Built at <b>Hacklodge 2022</b>
                        </h1>
                        <p className={"text-right"}>
                            Walden Yan<br/>
                            Allison Chen <br/>
                            Brandon Wang
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
