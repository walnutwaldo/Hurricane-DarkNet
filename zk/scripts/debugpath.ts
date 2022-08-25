import {ethers} from "hardhat";
import hasher from "./hasher";
import {BigNumber} from "ethers";

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const LEAF = "19616332773051217127231775132683539232514597215404186078616483029608492336643";

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const Hurricane = await ethers.getContractFactory("Hurricane");
    const hurricaneContract = await Hurricane.attach(CONTRACT_ADDRESS);

    const leaf = BigNumber.from(LEAF);
    const index = await hurricaneContract.leafForPubkey(leaf);
    console.log(`index: ${index}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
