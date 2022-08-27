import {ethers} from "hardhat";
import {BigNumber} from "ethers";

// Goerli Address: 0x6fcf2F9f82f2036FD14B01c98Df32a69Dd4ba58D
const NFT_ADDRESS = "0x6fcf2F9f82f2036FD14B01c98Df32a69Dd4ba58D";

const HURRICANE_ADDRESS = "0x33d4e6Ff9ac999C6545a6b7fC3305898F3D72881";
const USER_ADDRESS = "0x05521303316E6BCfE9AD287BD0C4e75d5B29cf46";
const NFT_IDS = ["2705"];

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
