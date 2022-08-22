import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-circom";
import dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
    solidity: {
        version: "0.6.11",
        settings: {
            optimizer: {
                enabled: false,
                // runs: 200
            }
        }
    },
    circom: {
        // (optional) Base path for input files, defaults to `./circuits/`
        inputBasePath: "./circuits",
        // (required) The final ptau file, relative to inputBasePath, from a Phase 1 ceremony
        ptau: "pot15_final.ptau",
        // (required) Each object in this array refers to a separate circuit
        circuits: [{name: "multiply"}],
    },
    networks: {
        goerli: {
            url: process.env.ALCHEMY_URL,
            accounts: [process.env.PRIVATE_KEY!]
        }
    }
};

export default config;
