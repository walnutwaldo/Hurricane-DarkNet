pragma solidity ^0.8.0;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./depositor.groth16_verifier.sol";
import "./verifier.groth16_verifier.sol";


contract DB is Verifier {
    uint256 size = 0;
    uint256 constant HEIGHT = 30;
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
            curr >>= 1;
        }
        Path path = Path(hashes, direction);
        return path;
    }

    function deposit(uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[93] memory input) external payable noReentrant {
        require(depositor.groth16_verifier(a, b, c, input), "Invalid Deposit Proof");
        size++;
        uint256 index = size;
        merkleRoot = bytes32(input[61]);
        bytes32[31] path;
        for (int i = 0; i<32; i++){
            path[i] = bytes32(input[62+i]);
        }

        require((merkleRoot == path[HEIGHT]), "Merkle Root Invalid");

        for (uint i = 0; i<HEIGHT+1; i++){
            merkleTree[index][i] = path[i];
            index >>= 1;
        }
        
        emit Deposit(size);

        require(msg.value == 1 ether, "deposit must be 1 ether");
       //  IERC20(ETH_ADDRESS).transferFrom(msg.sender, address(this), 1);
    }

    function withdraw(uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[3] memory input) external noReentrant {
        bytes32 root = bytes32(input[1]);
        bytes32 nullifer = bytes32(input[2]);

        require(nullifiers[nullifier]!= true, "Token Already Spent");
        require((root == merkleTree[0][merkleTree.length-1]), "Merkle Root Invalid");
        require(verifier.groth16_verifier.verifyProof(a, b, c, input), "Withdraw Proof Invalid");
        nullifers[nullifier]= true;
        emit Withdraw(nullifer);
        //IERC20(ETH_ADDRESS).transferFrom(address, msg.sender, address(this));
        (bool success, bytes memory data) = msg.sender.call{value : 1 ether}("");
        require(success, "withdraw failed");
    }
}