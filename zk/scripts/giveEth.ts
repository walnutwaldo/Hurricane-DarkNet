import hre, {ethers} from "hardhat";


const TARGET = "0x6fcf2F9f82f2036FD14B01c98Df32a69Dd4ba58D";

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
