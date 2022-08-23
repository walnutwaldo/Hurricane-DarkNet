import {ethers} from "hardhat";
import hasher from "./hasher";
import {BigNumber} from "ethers";

const CONTRACT_ADDRESS = "0x9A676e781A523b5d0C0e43731313A708CB607508";
const LEAF = "19616332773051217127231775132683539232514597215404186078616483029608492336643";

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const Hurricane = await ethers.getContractFactory("Hurricane");
    const hurricaneContract = await Hurricane.attach(CONTRACT_ADDRESS);

    const leaf = BigNumber.from(LEAF);
    const index = await hurricaneContract.indexOfLeaf(leaf);
    console.log(`index: ${index}`);

    const root = await hurricaneContract.merkleRoot();
    console.log(`root: ${root}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
