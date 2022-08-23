import {BigNumber} from "ethers";

export default function mimc(input: BigNumber | string | number, k: BigNumber | string | number) {
    input = BigNumber.from(input);
    k = BigNumber.from(k);
    return BigNumber.from(0);
}