import hre, {ethers} from "hardhat";
import {BigNumber} from "ethers";

const CONTRACT_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

async function main() {
    const Hurricane = await ethers.getContractFactory("Hurricane");
    const contract = Hurricane.attach(CONTRACT_ADDRESS);

    const result = await contract.getPath(BigNumber.from(0));
    console.log("Result:", result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
