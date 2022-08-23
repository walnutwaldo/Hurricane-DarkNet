pragma circom 2.0.6;

include "circomlib/mimc.circom";
include "circomlib/poseidon.circom";
include "withdrawer.circom";

component main { public [mimcK, receiver] } = Verifier(30, 91);
