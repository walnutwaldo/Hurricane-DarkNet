import {ethers} from "hardhat";
import {BigNumber} from "ethers";

const NFT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const USER_ADDRESS = "0xd84365dAd6e6dB6fa2d431992acB1e050789bE69";
const NFT_IDS = ["0", "1", "2", "3", "4"];

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const contract = await MyNFT.attach(NFT_ADDRESS);

    const contractAddress = contract.address;
    console.log(`Attached to NFT at ${contractAddress}`);

    for (const NFT_ID of NFT_IDS) {
        await contract.unsafeMint(USER_ADDRESS, BigNumber.from(NFT_ID)).then(async tx => {
            const res = await tx.wait();
            console.log(res);
            if (res.status) {
                const tokenId = res.events![0].args!.tokenId;
                console.log(`Minted token ${tokenId} to ${USER_ADDRESS}`);
            } else {
                console.log("Mint failed");
            }
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
