import {ethers} from "hardhat";

const PROXY_REGISTRY_ADDRESS = "0xa5409ec958c83c3f309868babaca7c86dcb077c1"; // Only works on Mainnet

async function main() {
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const estimateGas = await ethers.provider.estimateGas(MyNFT.getDeployTransaction(PROXY_REGISTRY_ADDRESS));
    console.log("MyNFT Estimated Gas:", estimateGas);
    const contract = await MyNFT.deploy(PROXY_REGISTRY_ADDRESS);

    const contractAddress = contract.address;
    console.log(`Deployed NFT at ${contractAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
