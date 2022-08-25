import {ethers} from "hardhat";
import hasher from "./hasher";
import {BigNumber} from "ethers";

const CONTRACT_ADDRESS = "0x40918Ba7f132E0aCba2CE4de4c4baF9BD2D7D849";
const LEAF_IDX = 1;

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const Hurricane = await ethers.getContractFactory("Hurricane");
    const hurricaneContract = await Hurricane.attach(CONTRACT_ADDRESS);

    console.log(`root: ${await hurricaneContract.merkleRoots(0)}`);
    console.log(`root: ${await hurricaneContract.merkleRoots(1)}`);
    console.log(`root: ${await hurricaneContract.merkleRoots(2)}`);
    console.log(`root: ${await hurricaneContract.merkleRoots(3)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
