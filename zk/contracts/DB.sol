pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./DepositVerifier.sol";
import "./WithdrawalVerifier.sol";


contract DB is ERC20, Verifier {
    address constant ETH_ADDRESS = 0x2170ed0880ac9a755fd29b2688956bd959f933f8; // might be wrong
    uint256 size = 0;
    uint256 constant HEIGHT = 4;
    bytes32[][] merkleTree;
    bytes32 merkleRoot;
    mapping(bytes32 => bool) nullifiers;

    event Deposit(uint256 index);
    event Withdraw(byte32 nullifier);

    struct Path{
        bytes32[] hashes;
        bool[] directions;
    }

    constructor(bytes32[] hashes) public ERC20("DB") {
        for (uint i = 0; i<HEIGHT+1; i++){
            bytes32[] layer;
            for (uint j = 0; j<2**(HEIGHT-i); j++) {
                layer.push(hashes[i]);
            }    
            merkleTree.push(layer);
        }
    }

    function getPath(uint256 index) public view returns (Path){
        bytes32[] hashes;
        bool[] directions;
        bytes32[] layer;
        uint256 curr = index;
        for (uint i = 0; i<HEIGHT+1; i++){
            layer = merkleTree[i];
            if (index & 1){
                hashes.push(layer[index]);
                directions.push(true);
            } else{
                hashes.push(layer[index]);
                directions.push(false);
            }
            curr = curr/2;
        }
        Path path = Path(hashes, direction);
        return path;
    }

    function deposit(uint256 memory index, uint256[HEIGHT] memory path) external noReentrant {
        require(DepositVerifier.verifyProof(index, path), "Invalid Deposit Proof");
        uint256 index = size;
        size++;
        
        for (uint i = 0; i<HEIGHT+1; i++){
            merkleTree[index][i] = path[i];
            index = index/2;
        }
        merkleRoot = path[HEIGHT];

        emit Deposit(size);
        IERC20(ETH_ADDRESS).transferFrom(msg.sender, address(this), 1);
    }

    function withdraw(bytes32 memory merkleRoot, bytes32 memory nullifier) external noReentrant {
        require(nullifiers[nullifier]!= true, "Token Already Spent");
        require(merkleRoot == merkleTree[0][merkleTree.length-1]);
        require(WithdrawVerifier.verifyProof(merkleRoot, nullifer));
        nullifers[nullifier]= true;
        emit Withdraw(nullifer);
        IERC20(ETH_ADDRESS).transferFrom(address, msg.sender, address(this));
    }
}