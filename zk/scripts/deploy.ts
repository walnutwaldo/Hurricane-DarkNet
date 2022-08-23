import {ethers} from "hardhat";

async function main() {
    const DummyHurricane = await ethers.getContractFactory("DummyHurricane");
    const contract = await DummyHurricane.deploy();

    const contractAddress = contract.address;
    console.log("Contract Address:", contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
