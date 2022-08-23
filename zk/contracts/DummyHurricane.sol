pragma solidity ^0.6.11;

import "./VerifierVerifier.sol";
import "./DepositorVerifier.sol";

contract DummyHurricane {

    DepositVerifier public depositVerifier;
    WithdrawVerifier public withdrawVerifier;
    uint public merkleRoot;
    uint public numLeaves;

    constructor() public {
        depositVerifier = new DepositVerifier();
        withdrawVerifier = new WithdrawVerifier();
    }

    function deposit(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[93] memory input
    ) public payable {
        require(msg.value == 1 ether, "deposit must be 1 ether");
        require(depositVerifier.verifyProof(a, b, c, input), "deposit proof is invalid");
    }

    function withdraw(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory input
    ) public {
        require(withdrawVerifier.verifyProof(a, b, c, input), "withdraw proof is invalid");
        (bool success, bytes memory data) = msg.sender.call{value : 1 ether}("");
        require(success, "withdraw failed");
    }

    function getPath(uint idx) public view returns (uint[30] memory siblings, uint[30] memory dirs) {
        for (uint i = 0; i < 30; i++) {
            siblings[i] = idx;
            dirs[i] = i % 2;
        }
        return (siblings, dirs);
    }

    function dummyFunction(uint input) public view returns (uint output) {
        return input;
    }
}
