pragma solidity ^0.8.0;

import "./ERC721Tradable.sol";

contract MyNFT is ERC721Tradable {

    constructor(address _proxyRegistryAddress) ERC721Tradable("FakeAzuki", "FAZK", _proxyRegistryAddress) {}

    function baseTokenURI() override public pure returns (string memory) {
        return "https://ikzttp.mypinata.cloud/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/";
    }

    function unsafeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId, "");
    }

}