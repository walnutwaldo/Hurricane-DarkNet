import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-circom";

import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
            {
                version: "0.8.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            },
        ]
    },
    circom: {
        // (optional) Base path for input files, defaults to `./circuits/`
        inputBasePath: "./circuits",
        // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
        ptau: "pot18_final.ptau",
        // (required) Each object in this array refers to a separate circuit
        circuits: [
            {name: "transfer"},
            {name: "withdraw"}
        ],
    },
    networks: {
        goerli: {
            url: process.env.ALCHEMY_URL,
            accounts: [process.env.PRIVATE_KEY!]
        },
        hardhat: {
            chainId: 1337
        }
    }
};

export default config;
