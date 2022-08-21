import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import '@rainbow-me/rainbowkit/styles.css';

import {
    getDefaultWallets, lightTheme,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
    chain,
    configureChains,
    createClient,
    WagmiConfig,
} from 'wagmi';
import {alchemyProvider} from 'wagmi/providers/alchemy';
import {publicProvider} from 'wagmi/providers/public';

const {chains, provider} = configureChains(
    [chain.mainnet, chain.goerli], //, chain.polygon, chain.optimism, chain.arbitrum],
    [
        alchemyProvider({apiKey: process.env.ALCHEMY_KEY}),
        publicProvider()
    ]
);

const {connectors} = getDefaultWallets({
    appName: 'ZK NFTs',
    chains
});

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider
})

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider chains={chains} theme={lightTheme({
                accentColor: '#55abda',
                accentColorForeground: 'white',
            })}>
                <App/>
            </RainbowKitProvider>
        </WagmiConfig>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
