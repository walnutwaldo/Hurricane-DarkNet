pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./DepositVerifier.sol";
import "./WithdrawalVerifier.sol";


contract DB is ERC20, Verifier {
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

    function deposit(uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[93] memory input, uint256 memory index, uint256[HEIGHT] memory path) external payable noReentrant {
        require(DepositVerifier.verifyProof(a, b, c, input), "Invalid Deposit Proof");
        uint256 index = size;
        size++;
        
        for (uint i = 0; i<HEIGHT+1; i++){
            merkleTree[index][i] = path[i];
            index = index/2;
        }
        merkleRoot = path[HEIGHT];

        emit Deposit(size);
        require(msg.value == 1 ether, "deposit must be 1 ether");
        require(depositVerifier.verifyProof(a, b, c, input), "deposit proof is invalid");
       //  IERC20(ETH_ADDRESS).transferFrom(msg.sender, address(this), 1);
    }

    function withdraw(uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[93] memory input, bytes32 memory merkleRoot, bytes32 memory nullifier) external noReentrant {
        require(nullifiers[nullifier]!= true, "Token Already Spent");
        require(merkleRoot == merkleTree[0][merkleTree.length-1]);
        require(WithdrawVerifier.verifyProof(a, b, c, input));
        nullifers[nullifier]= true;
        emit Withdraw(nullifer);
        //IERC20(ETH_ADDRESS).transferFrom(address, msg.sender, address(this));
        (bool success, bytes memory data) = msg.sender.call{value : 1 ether}("");
        require(success, "withdraw failed");
    }
}