import {BigNumber} from "ethers";
import React from "react";

export type Deposit = {
    secret: BigNumber,
    leaf: BigNumber
}

type SecretContext = {
    secret: BigNumber | undefined,
    setSecret?: (secret: BigNumber | undefined) => void,
    deposits: Deposit[],
    addDeposit?: (newDeposit: Deposit) => void,
    removeDeposit?: (idx: number) => void,
}

const DEFAULT_CONTEXT = {
    secret: undefined,
    deposits: [],
}

const SecretContext = React.createContext<SecretContext>(DEFAULT_CONTEXT);

export default SecretContext;