import {ethers} from "hardhat";
import {BigNumber} from "ethers";

async function main() {
    const DummyHurricane = await ethers.getContractFactory("DummyHurricane");
    const contract = await DummyHurricane.deploy();

    const contractAddress = contract.address;
    console.log("Contract Address:", contractAddress);

    // const a: [BigNumber, BigNumber] = [BigNumber.from(TEST_PROOF["pi_a"][0]), BigNumber.from(TEST_PROOF["pi_a"][1])];
    // const b: [[BigNumber, BigNumber], [BigNumber, BigNumber]] = [
    //     [BigNumber.from(TEST_PROOF["pi_b"][0][1]), BigNumber.from(TEST_PROOF["pi_b"][0][0])],
    //     [BigNumber.from(TEST_PROOF["pi_b"][1][1]), BigNumber.from(TEST_PROOF["pi_b"][1][0])]
    // ];
    // const c: [BigNumber, BigNumber] = [BigNumber.from(TEST_PROOF["pi_c"][0]), BigNumber.from(TEST_PROOF["pi_c"][1])];
    //
    // const input: [BigNumber] = [BigNumber.from(TEST_INPUT[0])];
    //
    // const result = await contract.deposit(a, b, c, input, {
    //     value: ethers.utils.parseEther("1")
    // });
    // console.log("Proof Verification Result:", result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
