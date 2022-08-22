pragma circom 2.0.6;

include "circomlib/mimc.circom";

template MerkleProof (nLayers, nRounds) {
    signal input secret; 
    signal input mimcK;
    signal input others[nLayers];
    signal output merkleRoot;
    
    signal path[nLayers+1];

    component hash[nLayers+1];
    
    for (var i = 0; i <= nLayers; i++) {
        hash[i] = MiMC7(nRounds);
    }

    hash[0].x_in <== secret;
    hash[0].k <== mimcK; 
    path[0] <== hash[0].out;

    for (var i = 1; i <= nLayers; i++) {
        hash[i].x_in <== path[i-1] + others[i-1];
        hash[i].k <== mimcK;
        path[i] <== hash[i].out;
    }

    merkleRoot <== path[nLayers];
}

component main { public [ mimcK ] } = MerkleProof(7, 10);
