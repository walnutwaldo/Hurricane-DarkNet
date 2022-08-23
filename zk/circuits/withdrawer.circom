pragma circom 2.0.6;

include "circomlib/poseidon.circom";

include "../node_modules/circomlib/circuits/mimcsponge.circom";

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


template Verifier (nLayers, nRounds) {
    signal output merkleRoot;
    signal output poseidonHash;

    signal input mimcK;
    signal input receiver;

    // Secret
    signal input secret;
    signal input others[nLayers];
    signal input dir[nLayers]; // 0 for left, 1 for right
    signal path[nLayers+1];

    component hash0 = MiMC7(nRounds);
    component hash[nLayers];
    component poseidon = Poseidon(1);
    
    for (var i = 0; i < nLayers; i++) {
        hash[i] = HashLeftRight();
    }   

    hash0.x_in <== secret;
    hash0.k <== mimcK; 
    path[0] <== hash0.out;

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
