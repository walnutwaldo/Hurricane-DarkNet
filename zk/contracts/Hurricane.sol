pragma solidity ^0.6.11;

import "./VerifierVerifier.sol";
import "./DepositorVerifier.sol";
import "./ReentrancyGuard.sol";

contract Hurricane is ReentrancyGuard {

    DepositVerifier public depositVerifier;
    WithdrawVerifier public withdrawVerifier;

    uint public merkleRoot;
    uint[][31] merkleTree;

    mapping(uint => uint) public indexOfLeaf;

    mapping(uint => bool) public nullifiers;

    constructor() public {
        depositVerifier = new DepositVerifier();
        withdrawVerifier = new WithdrawVerifier();
    }

    function numLeaves() public view returns (uint) {
        return merkleTree[0].length;
    }

    function setNode(uint layer, uint index, uint value) internal {
        if (index >= merkleTree[layer].length) {
            // The only way this happens is if index === merkleTree[layer].length
            merkleTree[layer].push(value);
        } else {
            merkleTree[layer][index] = value;
        }
    }

    function getNode(uint layer, uint index) internal view returns (uint) {
        if (index >= merkleTree[layer].length) {
            return 0;
        } else {
            return merkleTree[layer][index];
        }
    }

    function deposit(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[93] memory input
    ) public payable nonReentrant {
        require(msg.value == 1 ether, "Deposit must be 1 ether");
        require(depositVerifier.verifyProof(a, b, c, input), "Deposit proof is invalid");

        uint newMerkleRoot = input[0];
        uint mimcK = input[32];
        require(mimcK == 0, "MIMC K must be zero");

        // newMerkleRoot === last element of Path verified by circuit already
        // require(newMerkleRoot == input[31], "merkle root does not match last path element");

        uint currLayer = 0;
        uint currIndex = numLeaves();
        indexOfLeaf[input[1]] = currIndex;
        require(currIndex < 2 ** 30, "Too many leaves");

        for (; currLayer < 31; currLayer++) {
            // input[1 + i] is path[i]
            setNode(currLayer, currIndex, input[1 + currLayer]);
            if (currLayer < 30) {
                // input[33 + i] is others[i]
                // input[63 + i] is dirs[i]
                require(
                    getNode(currLayer, currIndex ^ 1) == input[33 + currLayer],
                    "Sibling path does not match"
                );
                require(
                    input[63 + currLayer] == (currIndex & 1),
                    "Sibling direction does not match"
                );
            }
            currIndex = currIndex >> 1;
        }

        merkleRoot = input[0];
    }

    function withdraw(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory input
    ) public nonReentrant {
        require(withdrawVerifier.verifyProof(a, b, c, input), "withdraw proof is invalid");
        require(input[0] == merkleRoot, "merkle root does not match");
        require(input[2] == 0, "MIMC K must be zero");

        uint nullifier = input[1];
        require(!nullifiers[nullifier], "Nullifier is already used");
        nullifiers[nullifier] = true;

        (bool success, bytes memory data) = msg.sender.call{value : 1 ether}("");
        require(success, "withdraw failed");
    }

    function getPath(uint idx) public view returns (uint[30] memory siblings, uint[30] memory dirs) {
        for (uint i = 0; i < 30; i++) {
            siblings[i] = getNode(i, idx ^ 1);
            dirs[i] = (idx & 1);
            idx = idx >> 1;
        }
    }

}
