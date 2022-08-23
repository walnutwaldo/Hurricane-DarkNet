import {time, loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";

const CONTRACT_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

describe("Hurricane", async function () {

    const DummyHurricane = await ethers.getContractFactory("DummyHurricane");
    const contract = DummyHurricane.attach(CONTRACT_ADDRESS);

    describe("GetPath", function () {
        it("Should give a normal result", async function () {
            const result = await contract.getPath(BigNumber.from(0));
            console.log("Result:", result);
        });
    });
});
