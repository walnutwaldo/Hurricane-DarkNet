pragma circom 2.0.6;

include "verifier.circom";

template Transfer(nLayers, nRounds) {
    signal output merkleRoot;
    signal output poseidonHash;
    signal output newLeaf;

    signal input mimcK;
    signal input newPubKey;

    // Secret
    signal input tokenAddress;
    signal input tokenId;
    signal input secret;
    signal input secretNoise;
    signal input newSecretNoise;
    signal input others[nLayers];
    signal input dir[nLayers]; // 0 for left, 1 for right

    component verifier = Verifier(nLayers, nRounds);

    verifier.mimcK <== mimcK;
    verifier.tokenAddress <== tokenAddress;
    verifier.tokenId <== tokenId;
    verifier.secret <== secret;
    verifier.secretNoise <== secretNoise;

    for (var i = 0; i < nLayers; i++) {
        verifier.others[i] <== others[i];
        verifier.dir[i] <== dir[i];
    }

    merkleRoot <== verifier.merkleRoot;
    poseidonHash <== verifier.poseidonHash;

    component leafHash = LeafHash();

    leafHash.pubKey <== newPubKey;
    leafHash.noise <== newSecretNoise;
    leafHash.tokenAddress <== tokenAddress;
    leafHash.tokenId <== tokenId;

    newLeaf <== leafHash.hash;
}

component main { public [mimcK, newPubKey] } = Transfer(30, 91);
