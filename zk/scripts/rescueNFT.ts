import {ethers} from "hardhat";
import {BigNumber} from "ethers";

const NFT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const HURRICANE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USER_ADDRESS = "0xd84365dAd6e6dB6fa2d431992acB1e050789bE69";
const NFT_IDS = ["0", "1", "2", "3", "4"];

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const Hurricane = await ethers.getContractFactory("Hurricane");

    const nftContract = await MyNFT.attach(NFT_ADDRESS);
    const contract = await Hurricane.attach(HURRICANE_ADDRESS);

    console.log(`Attached to NFT at ${nftContract.address}`);

    for (const NFT_ID of NFT_IDS) {
        if (await nftContract.ownerOf(BigNumber.from(NFT_ID)) === contract.address) {
            await contract.rescueNft(nftContract.address, BigNumber.from(NFT_ID)).then(async tx => {
                const res = await tx.wait();
                console.log(res);
                if (res?.status) {
                    const tx2 = await nftContract.transferFrom(
                        signer.address,
                        USER_ADDRESS,
                        BigNumber.from(NFT_ID)
                    )
                    const res2 = await tx2.wait();
                    if (res2.status) {
                        console.log(`Saved token ${BigNumber.from(NFT_ID)} back to ${USER_ADDRESS}`);
                    } else {
                        console.log("Transfer to user failed");
                    }
                } else {
                    console.log("Save failed");
                }
            });
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
