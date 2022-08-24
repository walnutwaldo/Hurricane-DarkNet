import {BigNumber} from "ethers";
import React from "react";

export type Secret = {
    secret: BigNumber,
    shared: BigNumber,
    isPaid: boolean
}

type SecretContext = {
    secrets: Secret[],
    addSecret?: (newSecret: Secret) => void,
    removeSecret?: (idx: number) => void,
}

const DEFAULT_CONTEXT = {
    secrets: [],
}

const SecretContext = React.createContext<SecretContext>(DEFAULT_CONTEXT);

export default SecretContext;
