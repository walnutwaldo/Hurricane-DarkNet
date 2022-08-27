import {ethers} from "hardhat";
import hasher from "./hasher";
import * as fs from "fs";

const FRONTEND_ABI_PATH = "../frontend/src/contracts/hurricane_abi.json";
const FRONTEND_ADDRESSES_PATH = "../frontend/src/contracts/hurricane_addresses.json";
const HURRICANE_ARTIFACT_PATH = "./artifacts/contracts/Hurricane.Sol/Hurricane.json";

const HurricaneABI = JSON.parse(
    fs.readFileSync(HURRICANE_ARTIFACT_PATH, "utf8")
)["abi"];

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const gasOptions = {
        gasPrice: ethers.utils.parseUnits("3", "gwei"),
    }

    const Hasher = new ethers.ContractFactory(hasher.abi, hasher.bytecode, signer);
    const hasherGasEsimate = await ethers.provider.estimateGas(Hasher.getDeployTransaction());
    console.log("Hasher Gas Estimate:", hasherGasEsimate);
    const hasherContract = await Hasher.deploy(gasOptions);
    console.log(`Deployed Hasher at ${hasherContract.address}`);
    const hasherContractAddress = hasherContract.address;
    // const hasherContractAddress = "0xC173fc0504322b9dA049E2e0439cF178D61d5728";

    const Hurricane = await ethers.getContractFactory("Hurricane");
    console.log(Hurricane.getDeployTransaction(hasherContractAddress));
    const estimatedGas = await ethers.provider.estimateGas(Hurricane.getDeployTransaction(hasherContractAddress));
    console.log("Hurricane Estimated Gas:", estimatedGas);
    const contract = await Hurricane.deploy(hasherContractAddress, gasOptions);
    const contractAddress = contract.address;
    console.log(`Deployed Hurricane at ${contractAddress}`);

    console.log(`WithdrawVerifier is at ${await contract.withdrawVerifier()}`);
    console.log(`TransferVerifier is at ${await contract.transferVerifier()}`);

    fs.writeFileSync(FRONTEND_ABI_PATH, JSON.stringify(HurricaneABI, null, '\t'));
    let hurricaneAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_PATH, "utf8"));
    let networkName = (await ethers.provider.getNetwork()).name.toLowerCase();
    if (networkName === 'unknown') networkName = "localhost";
    hurricaneAddresses[networkName] = contractAddress;
    fs.writeFileSync(FRONTEND_ADDRESSES_PATH, JSON.stringify(hurricaneAddresses, null, '\t'));
    console.log(`Updated ABI and ${networkName} address in frontend`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
