import {BigNumber} from "ethers";
import React from "react";

export type Secret = {
    secret: BigNumber,
    shared: BigNumber,
}

type SecretContext = {
    keys: Secret[],
	assets: Secret[],
    addKey?: (newSecret: Secret) => void,
    addAsset?: (newSecret: Secret) => void,
    removeKey?: (idx: number) => void,
    removeAsset?: (idx: number) => void,
	updateStatus?: (idx: number) => void,
}

const DEFAULT_CONTEXT = {
	keys: [],
	assets: [],
}

const SecretContext = React.createContext<SecretContext>(DEFAULT_CONTEXT);

export default SecretContext;
