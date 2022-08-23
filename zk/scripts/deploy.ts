import {ethers} from "hardhat";

async function main() {
    const Hurricane = await ethers.getContractFactory("Hurricane");
    const contract = await Hurricane.deploy();

    const contractAddress = contract.address;
    console.log("Contract Address:", contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
