pragma solidity ^0.6.11;

import "./WithdrawVerifier.sol";
import "./TransferVerifier.sol";
import "./openzeppelin/utils/ReentrancyGuard.sol";
import "./openzeppelin/access/Ownable.sol";
import "./openzeppelin/token/ERC721/IERC721.sol";

interface IHasher {
    function MiMCSponge(uint256 in_xL, uint256 in_xR, uint256 k) external pure returns (uint256 xL, uint256 xR);
}

contract Hurricane is ReentrancyGuard, Ownable {

    WithdrawVerifier immutable public withdrawVerifier;
    TransferVerifier immutable public transferVerifier;

    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint public constant ROOT_WINDOW = 256;
    uint8 public rootIndex = 0;

    IHasher public immutable hasher;

    uint[ROOT_WINDOW] public merkleRoots;
    uint[][31] merkleTree;

    mapping(uint => uint) public leafForPubkey;
    mapping(uint => uint) public dataForPubkey;

    mapping(uint => bool) public nullifiers;

    constructor(IHasher _hasher) public {
        hasher = _hasher;
        withdrawVerifier = new WithdrawVerifier();
        transferVerifier = new TransferVerifier();
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

    function depositUpdate(
        uint publicKey,
        uint256 data,
        uint leaf
    ) internal {
        uint currIndex = numLeaves();
        require(currIndex < 2 ** 30, "Too many leaves");

        setNode(0, currIndex, leaf);

        leafForPubkey[publicKey] = currIndex;
        dataForPubkey[publicKey] = data;

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

    function deposit(
        uint publicKey,
        IERC721 token,
        uint256 tokenId,
        uint256 data,
        uint leaf
    ) public payable nonReentrant {
        require(msg.value == 0.1 ether, "Deposit must be 0.1 ether");
        depositUpdate(publicKey, data, leaf);
        token.safeTransferFrom(msg.sender, address(this), tokenId);
    }

    function withdrawUpdate(
        uint merkleRoot,
        uint mimcK,
        uint nullifier,
        uint8 rootIdx
    ) internal {
        require(merkleRoot == merkleRoots[rootIdx], "Merkle root does not match");
        require(mimcK == 0, "MIMC K must be zero");

        require(!nullifiers[nullifier], "Nullifier is already used");
        nullifiers[nullifier] = true;
    }

    function withdraw(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[6] memory input,
        uint8 rootIdx
    ) public nonReentrant {
        require(withdrawVerifier.verifyProof(a, b, c, input), "Withdraw proof is invalid");
        require(uint160(input[5]) == uint160(msg.sender), "Receiver does not match");

        withdrawUpdate(
            input[0], // merkleRoot
            input[2], // mimcK
            input[1], // nullifier
            rootIdx
        );

        IERC721 token = IERC721(input[3]);
        uint256 tokenId = input[4];
        token.safeTransferFrom(address(this), msg.sender, tokenId);
    }

    function transfer(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[5] memory input,
        uint8 rootIdx,
        uint256 data
    ) public nonReentrant {
        require(transferVerifier.verifyProof(a, b, c, input), "Transfer proof is invalid");
        withdrawUpdate(
            input[0], // merkleRoot
            input[3], // mimcK
            input[1], // nullifier
            rootIdx = rootIdx
        );
        depositUpdate(
            input[4], // publicKey
            data, // data
            input[2] // leaf
        );
    }

    function getPath(uint idx) public view returns (uint[30] memory siblings, uint[30] memory dirs, uint8 rootIdx) {
        for (uint i = 0; i < 30; i++) {
            siblings[i] = getNode(i, idx ^ 1);
            dirs[i] = (idx & 1);
            idx = idx >> 1;
        }
        rootIdx = rootIndex;
    }

    // --------------------------------------------------------------
    //                          BACKDOOR
    // --------------------------------------------------------------

    function rescueFunds() public onlyOwner {
        (bool success, bytes memory data) = msg.sender.call{value : address(this).balance}("");
        require(success, "Rescue failed");
    }

    function rescueNft(
        IERC721 token,
        uint256 tokenId
    ) public onlyOwner {
        token.transferFrom(address(this), msg.sender, tokenId);
    }

}
