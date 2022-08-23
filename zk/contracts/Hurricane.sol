pragma solidity ^0.6.11;

import "./ReentrancyGuard.sol";
import "./DepositorBigVerifier.sol";
import "./WithdrawerBigVerifier.sol";

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

    function depositUpdate(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[93] memory input
    ) internal {
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

    function deposit(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[93] memory input
    ) public payable nonReentrant {
        require(msg.value == 1 ether, "Deposit must be 1 ether");
        depositUpdate(a, b, c, input);
    }

    function withdrawUpdate(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) internal {
        require(withdrawVerifier.verifyProof(a, b, c, input), "withdraw proof is invalid");
        require(input[0] == merkleRoot, "merkle root does not match");
        require(input[2] == 0, "MIMC K must be zero");

        uint nullifier = input[1];
        require(!nullifiers[nullifier], "Nullifier is already used");
        nullifiers[nullifier] = true;
    }

    function withdraw(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input
    ) public nonReentrant {
        require(uint160(input[3]) == uint160(msg.sender), "Receiver does not match");
        withdrawUpdate(a, b, c, input);

        (bool success, bytes memory data) = msg.sender.call{value : 1 ether}("");
        require(success, "withdraw failed");
    }

    function transfer(
        uint[2] memory senderA,
        uint[2][2] memory senderB,
        uint[2] memory senderC,
        uint[4] memory senderInput,
        uint[2] memory receiverA,
        uint[2][2] memory receiverB,
        uint[2] memory receiverC,
        uint[93] memory receiverInput
    ) public nonReentrant {
        require(senderInput[3] == receiverInput[1], "Receiver does not match");
        withdrawUpdate(senderA, senderB, senderC, senderInput);
        depositUpdate(receiverA, receiverB, receiverC, receiverInput);
    }

    function getPath(uint idx) public view returns (uint[30] memory siblings, uint[30] memory dirs) {
        for (uint i = 0; i < 30; i++) {
            siblings[i] = getNode(i, idx ^ 1);
            dirs[i] = (idx & 1);
            idx = idx >> 1;
        }
    }

}
