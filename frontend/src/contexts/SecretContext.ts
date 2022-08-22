import {BigNumber} from "ethers";
import React from "react";

type SecretContext = {
    secret?: BigNumber,
    setSecret?: (secret: BigNumber) => void,
}

const DEFAULT_CONTEXT = {
    secret: undefined,
    setSecret: undefined,
}

const SecretContext = React.createContext<SecretContext>(DEFAULT_CONTEXT);

export default SecretContext;