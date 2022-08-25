pragma solidity ^0.6.11;

import "./ReentrancyGuard.sol";
import "./WithdrawerBigVerifier.sol";

interface IHasher {
    function MiMCSponge(uint256 in_xL, uint256 in_xR, uint256 k) external pure returns (uint256 xL, uint256 xR);
}

contract Hurricane is ReentrancyGuard, Verifier {

    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint public constant ROOT_WINDOW = 256;
    uint8 public rootIndex = 0;

    IHasher public immutable hasher;

    uint[ROOT_WINDOW] public merkleRoots;
    uint[][31] merkleTree;

    mapping(uint => uint) public indexOfLeaf;

    mapping(uint => bool) public nullifiers;

    constructor(IHasher _hasher) public {
        hasher = _hasher;
        merkleTree[0].push(0);
		merkleTree[0].push(0);
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

    function hashLeftRight(
        IHasher _hasher,
        uint _left,
        uint _right
    ) internal pure returns (uint) {
        //        require(_left < FIELD_SIZE, "_left should be inside the field");
        //        require(_right < FIELD_SIZE, "_right should be inside the field");
        uint R = _left;
        uint C = 0;
        (R, C) = _hasher.MiMCSponge(R, C, 0);
        R = addmod(R, _right, FIELD_SIZE);
        (R, C) = _hasher.MiMCSponge(R, C, 0);
        return R;
    }

    function depositUpdate(uint leaf) internal {
        uint currIndex = numLeaves();
        require(currIndex < 2 ** 30, "Too many leaves");

        indexOfLeaf[leaf] = currIndex;
        setNode(0, currIndex, leaf);

        currIndex >>= 1;
        for (uint currLayer = 1; currLayer < 31; currLayer++) {
            // input[1 + i] is path[i]
            setNode(
                currLayer,
                currIndex,
                hashLeftRight(
                    hasher,
                    getNode(currLayer - 1, currIndex << 1),
                    getNode(currLayer - 1, (currIndex << 1) | 1)
                )
            );
            currIndex = currIndex >> 1;
        }

        merkleRoots[++rootIndex] = getNode(30, 0);
    }

    function deposit(uint leaf) public payable nonReentrant {
        require(msg.value == 0.1 ether, "Deposit must be 0.1 ether");
        depositUpdate(leaf);
    }

    function withdrawUpdate(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input,
        uint8 rootIdx
    ) internal {
        require(verifyProof(a, b, c, input), "Withdraw proof is invalid");
        require(input[0] == merkleRoots[rootIdx], "Merkle root does not match");
        require(input[2] == 0, "MIMC K must be zero");

        uint nullifier = input[1];
        require(!nullifiers[nullifier], "Nullifier is already used");
        nullifiers[nullifier] = true;
    }

    function withdraw(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory input,
        uint8 rootIdx
    ) public nonReentrant {
        require(uint160(input[3]) == uint160(msg.sender), "Receiver does not match");
        withdrawUpdate(a, b, c, input, rootIdx);

        (bool success, bytes memory data) = msg.sender.call{value : 0.1 ether}("");
        require(success, "withdraw failed");
    }

    function transfer(
        uint[2] memory senderA,
        uint[2][2] memory senderB,
        uint[2] memory senderC,
        uint[4] memory senderInput,
        uint8 rootIdx,
        uint receiverLeaf
    ) public nonReentrant {
        require(senderInput[3] == receiverLeaf, "Receiver does not match");
        withdrawUpdate(senderA, senderB, senderC, senderInput, rootIdx);
        depositUpdate(receiverLeaf);
    }

    function getPath(uint idx) public view returns (uint[30] memory siblings, uint[30] memory dirs, uint8 rootIdx) {
        for (uint i = 0; i < 30; i++) {
            siblings[i] = getNode(i, idx ^ 1);
            dirs[i] = (idx & 1);
            idx = idx >> 1;
        }
        rootIdx = rootIndex;
    }

}
