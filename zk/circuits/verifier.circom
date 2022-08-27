pragma circom 2.0.6;

include "../node_modules/circomlib/circuits/mimc.circom";
include "../node_modules/circomlib/circuits/mimcsponge.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

// Computes MiMC([left, right])
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = MiMCSponge(2, 220, 1);
    hasher.ins[0] <== left;
    hasher.ins[1] <== right;
    hasher.k <== 0;
    hash <== hasher.outs[0];
}

// Computes Hash(pubKey, Hash(Hash(tokenAddress, tokenId), noise))
template LeafHash() {
    signal output hash;

    signal input pubKey;
    signal input noise;
    signal input tokenAddress;
    signal input tokenId;

    component nftHash = HashLeftRight();
    component noiseNftHash = HashLeftRight();
    component leafHash = HashLeftRight();

    // Leaf Hashing
    nftHash.left <== tokenAddress;
    nftHash.right <== tokenId;
    noiseNftHash.left <== nftHash.hash;
    noiseNftHash.right <== noise;
    leafHash.left <== pubKey;
    leafHash.right <== noiseNftHash.hash;

    hash <== leafHash.hash;
}


template Verifier (nLayers, nRounds) {
    signal output merkleRoot;
    signal output poseidonHash;

    signal input mimcK;
    signal input tokenAddress;
    signal input tokenId;

    // Always Secret
    signal input secret;
    signal input secretNoise;
    signal input others[nLayers];
    signal input dir[nLayers]; // 0 for left, 1 for right

    signal pubKey;
    signal path[nLayers+1];

    component pkHash = MiMC7(nRounds);

    component leafHash = LeafHash();

    component hash[nLayers];
    component poseidon = Poseidon(1);
    
    for (var i = 0; i < nLayers; i++) {
        hash[i] = HashLeftRight();
    }   

    // Public Key Hashing
    pkHash.x_in <== secret;
    pkHash.k <== mimcK;

    // New leaf hashing (for transfer)
    leafHash.pubKey <== pkHash.out;
    leafHash.noise <== secretNoise;
    leafHash.tokenAddress <== tokenAddress;
    leafHash.tokenId <== tokenId;
    path[0] <== leafHash.hash;

    for (var i = 0; i < nLayers; i++) {
        hash[i].left <== path[i] + dir[i] * (others[i] - path[i]);
        hash[i].right <== path[i] + others[i] - hash[i].left;
        path[i+1] <== hash[i].hash;
    }   

    for (var i = 0; i < nLayers; i++) {
        dir[i] === dir[i] * dir[i]; // no cheating
    }   

    poseidon.inputs[0] <== secret;

    merkleRoot <== path[nLayers];
    poseidonHash <== poseidon.out;
}
