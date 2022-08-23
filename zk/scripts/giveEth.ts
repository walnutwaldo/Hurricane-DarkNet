import hre, {ethers} from "hardhat";

const TARGET = "0xd84365dAd6e6dB6fa2d431992acB1e050789bE69";

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];
    const provider = signer.provider!;

    let balance = await provider.getBalance(TARGET);
    console.log("Balance:", ethers.utils.formatEther(balance));

    const tx = await signer.sendTransaction({
        to: TARGET,
        value: ethers.utils.parseEther("10")
    });
    console.log("Transaction Hash:", tx.hash);

    balance = await provider.getBalance(TARGET);
    console.log("New Balance:", ethers.utils.formatEther(balance));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
