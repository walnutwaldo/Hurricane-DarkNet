pragma circom 2.0.6;

include "circomlib/mimc.circom";

template Depositor (nLayers, nRounds) {
    signal input secret; 
    signal input address;
    signal input mimcK;
    signal input others[nLayers];
    signal input dir[nLayers]; // 0 for left, 1 for right
    signal output merkleRoot;
    signal output path[nLayers+1];

    component hash0 = MiMC7(nRounds);
    component hash[nLayers];
    
    for (var i = 0; i < nLayers; i++) {
        hash[i] = MultiMiMC7(2, nRounds);
    }   

    hash0.x_in <== secret;
    hash0.k <== mimcK; 
    path[0] <== hash0.out;

    for (var i = 0; i < nLayers; i++) {
        hash[i].in[0] <== path[i] + dir[i] * (others[i] - path[i]);
        hash[i].in[1] <== path[i] + others[i] - hash[i].in[0];
        hash[i].k <== mimcK;
        path[i+1] <== hash[i].out;
    }   

    for (var i = 0; i < nLayers; i++) {
        dir[i] === dir[i] * dir[i]; // no cheating
    }   

    merkleRoot <== path[nLayers];
}

component main { public [mimcK, others, dir] } = Depositor(30, 91);


