pragma solidity ^0.8.0;

import "./MultiplyVerifier.sol";

contract DummyHurricane is Verifier {

    uint public merkleRoot;

    constructor() public {
        // do nothing
    }

    function deposit(uint[] memory input, Proof memory proof) public payable {

    }

    function withdraw(uint[] memory input, Proof memory proof) public {

    }

    function getPath() public {

    }

}
