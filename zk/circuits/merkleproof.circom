pragma circom 2.0.6;

include "circomlib/mimc.circom";

template MerkleProof (nLayers, nRounds) {
    signal input secret; 
    signal input mimcK;
    signal input others[nLayers];
    signal input dir[nLayers]; // 0 for left, 1 for right
    signal output merkleRoot;
    
    signal path[nLayers+1];
    signal left[nLayers];
    signal right[nLayers];

    component hash0 = MiMC7(nRounds);
    component leftHash[nLayers];
    component rightHash[nLayers];
    
    for (var i = 0; i < nLayers; i++) {
        leftHash[i] = MultiMiMC7(2, nRounds);
        rightHash[i] = MultiMiMC7(2, nRounds);
    }   

    hash0.x_in <== secret;
    hash0.k <== mimcK; 
    path[0] <== hash0.out;

    for (var i = 0; i < nLayers; i++) {
        leftHash[i].in[0] <== path[i]; 
        leftHash[i].in[1] <== others[i];
        rightHash[i].in[1] <== path[i]; 
        rightHash[i].in[0] <== others[i];
        leftHash[i].k <== mimcK;
        rightHash[i].k <== mimcK;
        left[i] <== leftHash[i].out - dir[i] * leftHash[i].out;
        right[i] <== dir[i] * rightHash[i].out;
        path[i+1] <== left[i] + right[i];
    }   

    for (var i = 0; i < nLayers; i++) {
        dir[i] === dir[i] * dir[i]; // no cheating
    }

    merkleRoot <== path[nLayers];
}

component main = MerkleProof(8, 91);
