import {ethers} from "hardhat";
import hasher from "./hasher";

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const Hasher = new ethers.ContractFactory(hasher.abi, hasher.bytecode, signer);
    const hasherContract = await Hasher.deploy();
    console.log(`Deployed Hasher at ${hasherContract.address}`);

    const Hurricane = await ethers.getContractFactory("Hurricane");
    const contract = await Hurricane.deploy(hasherContract.address);

    const contractAddress = contract.address;
    console.log(`Deployed Hurricane at ${contractAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
