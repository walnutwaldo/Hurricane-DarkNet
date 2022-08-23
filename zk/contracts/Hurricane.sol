pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface DepositVerifierI {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[93] memory input
    ) external view returns (bool r);
}

interface WithdrawVerifierI {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory input
    ) external view returns (bool r);
}


contract Hurricane is ReentrancyGuard {

    uint256 public constant HEIGHT = 30;

    uint256 public numLeaves = 0;
    bytes32 public merkleRoot;
    bytes32[][] merkleTree;
    mapping(bytes32 => bool) nullifiers;

    DepositVerifierI public immutable depositVerifier;
    WithdrawVerifierI public immutable withdrawVerifier;

    event Deposit(uint256 index);
    event Withdraw(bytes32 nullifier);

    struct Path {
        bytes32[HEIGHT] siblings;
        uint256[HEIGHT] dirs;
    }

    constructor(bytes32[HEIGHT + 1] memory hashes, address depositVerifierAddr, address withdrawVerifierAddr) public {
        depositVerifier = DepositVerifierI(depositVerifierAddr);
        withdrawVerifier = WithdrawVerifierI(withdrawVerifierAddr);

        // TODO: make this implicit
        for (uint i = 0; i < HEIGHT + 1; i++) {
            bytes32[] storage layer;
            for (uint j = 0; j < 2 ** (HEIGHT - i); j++) {
                layer.push(hashes[i]);
            }
            merkleTree.push(layer);
        }
    }

    function getPath(uint256 index) public view returns (Path memory path) {
        bytes32[] storage layer;
        uint256 curr = index;
        for (uint i = 0; i < HEIGHT + 1; i++) {
            layer = merkleTree[i];
            path.siblings[i] = layer[curr];
            path.dirs[i] = index & 1;
            curr >>= 1;
        }
        return path;
    }

    function deposit(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3 * HEIGHT + 3] memory input
    ) external payable nonReentrant {
        require(msg.value == 1 ether, "deposit must be 1 ether");

        // TODO: verify that committed token isn't the hash of 0

        require(depositVerifier.verifyProof(a, b, c, input), "Invalid Deposit Proof");

        uint256 index = numLeaves++;
        merkleRoot = bytes32(input[61]);

        require((merkleRoot == bytes32(input[3 * HEIGHT + 2])), "Merkle Root Invalid");

        for (uint i = 0; i < HEIGHT + 1; i++) {
            merkleTree[index][i] = bytes32(input[2 * HEIGHT + 2 + i]);
            index >>= 1;
        }

        emit Deposit(numLeaves);
    }

    function withdraw(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory input
    ) external nonReentrant {
        bytes32 root = bytes32(input[1]);
        bytes32 nullifier = bytes32(input[2]);

        require(nullifiers[nullifier] != true, "Token Already Spent");
        nullifiers[nullifier] = true;

        require(root == merkleRoot, "Merkle Root Invalid");

        require(withdrawVerifier.verifyProof(a, b, c, input), "Withdraw Proof Invalid");

        (bool success, bytes memory data) = msg.sender.call{value : 1 ether}("");
        require(success, "withdraw failed");

        emit Withdraw(nullifier);
    }
}