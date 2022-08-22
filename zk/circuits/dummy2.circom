pragma circom 2.0.3;

template Main () {
    signal input a;
    signal input b;
    signal input c;
    signal output out;

    out <== a * b - c;
}

component main = Main();