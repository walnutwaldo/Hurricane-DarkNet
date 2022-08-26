import {ethers} from "hardhat";

const nftsToDelete = {"ownedNfts":[{"contract":{"address":"0xfa1ff54d7dade6a85545b427a9f01080ce763c90"},"tokenId":"1","tokenType":"ERC721","title":"Azuki #1","description":"","timeLastUpdated":"2022-08-25T01:41:23.383Z","rawMetadata":{"name":"Azuki #1","image":"https://ikzttp.mypinata.cloud/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/1.png","attributes":[{"value":"Human","trait_type":"Type"},{"value":"Pink Hairband","trait_type":"Hair"},{"value":"White Qipao with Fur","trait_type":"Clothing"},{"value":"Daydreaming","trait_type":"Eyes"},{"value":"Lipstick","trait_type":"Mouth"},{"value":"Gloves","trait_type":"Offhand"},{"value":"Off White D","trait_type":"Background"}]},"tokenUri":{"raw":"https://ikzttp.mypinata.cloud/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/1","gateway":"https://ipfs.io/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/1"},"media":[{"raw":"https://ikzttp.mypinata.cloud/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/1.png","gateway":"https://ipfs.io/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/1.png"}],"balance":1},{"contract":{"address":"0xfa1ff54d7dade6a85545b427a9f01080ce763c90"},"tokenId":"2","tokenType":"ERC721","title":"Azuki #2","description":"","timeLastUpdated":"2022-08-25T01:41:23.387Z","rawMetadata":{"name":"Azuki #2","image":"https://ikzttp.mypinata.cloud/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/2.png","attributes":[{"value":"Human","trait_type":"Type"},{"value":"Pink Flowy","trait_type":"Hair"},{"value":"Red Tassel","trait_type":"Ear"},{"value":"Vest","trait_type":"Clothing"},{"value":"Ruby","trait_type":"Eyes"},{"value":"Chewing","trait_type":"Mouth"},{"value":"Red","trait_type":"Background"}]},"tokenUri":{"raw":"https://ikzttp.mypinata.cloud/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/2","gateway":"https://ipfs.io/ipfs/QmQFkLSQysj94s5GvTHPyzTxrawwtjgiiYS2TBLgrvw8CW/2"},"media":[{"raw":"https://ikzttp.mypinata.cloud/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/2.png","gateway":"https://ipfs.io/ipfs/QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/2.png"}],"balance":1}],"totalCount":2};

const BURN_ADDR = "0x0000000000000000000000000000000000000001";

async function main() {
    const signers = await ethers.getSigners();
    const signer = signers[0];

    const MyNFT = await ethers.getContractFactory("MyNFT");

    for (const nft of nftsToDelete.ownedNfts) {
        const contract = await MyNFT.attach(nft.contract.address);
        console.log(`Attached to NFT at ${contract.address}`);

        const id = nft.tokenId;
        if (await contract.ownerOf(id) === signer.address) {
            await contract.transferFrom(signer.address, BURN_ADDR, id, {gasLimit: 10000000});
            console.log(`Deleted NFT ${id}`);
        } else {
            console.log(`NFT ${id} not owned by ${signer.address}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
