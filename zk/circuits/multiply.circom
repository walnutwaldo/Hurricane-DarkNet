pragma circom 2.0.3;

template Main () {
    signal input a;
    signal input b;
    signal output c;

    c <== a * b;
}

component main = Main();