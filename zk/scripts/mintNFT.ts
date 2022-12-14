import {ethers} from "hardhat";
import {BigNumber} from "ethers";

// Goerli Address: 0x6fcf2F9f82f2036FD14B01c98Df32a69Dd4ba58D
const NFT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

const USER_ADDRESS = "0xd84365dAd6e6dB6fa2d431992acB1e050789bE69";
const NFT_IDS = ["0", "1", "2", "3", "4", "5"];

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const MyNFT = await ethers.getContractFactory("MyNFT");
    const contract = await MyNFT.attach(NFT_ADDRESS);

    const contractAddress = contract.address;
    console.log(`Attached to NFT at ${contractAddress}`);

    for (const NFT_ID of NFT_IDS) {
        // const owner = await contract.ownerOf(BigNumber.from(NFT_ID));
        // if (owner !== ethers.constants.AddressZero) {
        console.log(`Minting NFT ${NFT_ID}`);
        await contract.unsafeMint(
            USER_ADDRESS,
            BigNumber.from(NFT_ID),
            {
                gasLimit: 10000000,
            }
        ).then(async tx => {
            console.log("Signed txn");
            const res = await tx.wait();
            // console.log(res);
            if (res?.status) {
                const tokenId = res.events![0].args!.tokenId;
                console.log(`Minted token ${tokenId} to ${USER_ADDRESS}`);
            } else {
                console.log("Mint failed");
            }
        });
        // } else {
        //     console.log(`Token ${NFT_ID} already minted`);
        // }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
