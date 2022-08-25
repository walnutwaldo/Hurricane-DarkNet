import {BigNumber} from "ethers";
import React from "react";
import mimc from "../crypto/mimc";

const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

export type Secret = {
    secret: BigNumber,
    shared: BigNumber,
    noise: BigNumber,
    tokenMask: BigNumber,
    tokenIdMask: BigNumber,
}

export function secretToJson(secret: Secret) : any {
    return {
        secret: secret.secret.toString(),
        shared: secret.shared.toString(),
        noise: secret.noise.toString(),
        tokenMask: secret.tokenMask.toString(),
        tokenIdMask: secret.tokenIdMask.toString()
    };
}

export function jsonToSecret(json: any) : Secret {
    return {
        secret: BigNumber.from(json.secret),
        shared: BigNumber.from(json.shared),
        noise: BigNumber.from(json.noise),
        tokenMask: BigNumber.from(json.tokenMask),
        tokenIdMask: BigNumber.from(json.tokenIdMask),
    };
}

export function secretToPrivateKey(secret: Secret): string {
    return secret.secret
        .mul(MODULUS).add(secret.noise)
        .mul(MODULUS).add(secret.tokenMask)
        .mul(MODULUS).add(secret.tokenIdMask)
        .toHexString();
}

export function secretToSharedKey(secret: Secret): string {
    return secret.shared
        .mul(MODULUS).add(secret.noise)
        .mul(MODULUS).add(secret.tokenMask)
        .mul(MODULUS).add(secret.tokenIdMask)
        .toHexString();
}

export function privateKeyToSecret(pKey: string) {
    let num = BigNumber.from(pKey);
    const tokenIdMask = num.mod(MODULUS);
    num = num.div(MODULUS);
    const tokenMask = num.mod(MODULUS);
    num = num.div(MODULUS);
    const noise = num.mod(MODULUS);
    num = num.div(MODULUS);
    const secret = num.mod(MODULUS);
    return {
        secret,
        noise,
        tokenMask,
        tokenIdMask,
    }
}

export function sharedKeyToSecret(sKey: string) {
    let num = BigNumber.from(sKey);
    const tokenIdMask = num.mod(MODULUS);
    num = num.div(MODULUS);
    const tokenMask = num.mod(MODULUS);
    num = num.div(MODULUS);
    const noise = num.mod(MODULUS);
    num = num.div(MODULUS);
    const shared = num.mod(MODULUS);
    return {
        shared,
        noise,
        tokenMask,
        tokenIdMask,
    }
}

function getRandomFieldElement(): BigNumber {
    const randomBytes = crypto.getRandomValues(new Uint32Array(10));
    // Concatenate into hex string
    const randString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
    return BigNumber.from("0x" + randString).mod(MODULUS);
}

export function generateSecret(): Secret {
    const secret = getRandomFieldElement();
    const noise = getRandomFieldElement();
    const mask1 = getRandomFieldElement();
    const mask2 = getRandomFieldElement();
    const shared = mimc(secret, "0");
    return {
        secret: secret,
        shared: shared,
        noise: noise,
        tokenMask: mask1,
        tokenIdMask: mask2
    };
}

export function maskTokenData(
    tokenAddress: string,
    tokenId: BigNumber | string,
    secret: {
        tokenMask: BigNumber,
        tokenIdMask : BigNumber
    } & any
) {
    const token = BigNumber.from(tokenAddress);
    tokenId = BigNumber.from(tokenId);
    return [
        token.add(secret.tokenMask).mod(MODULUS),
        tokenId.add(secret.tokenIdMask).mod(MODULUS),
    ]
}

export function unmaskTokenData(
    maskedData: [BigNumber, BigNumber],
    secret: {
        tokenMask: BigNumber,
        tokenIdMask : BigNumber
    } & any
) {
    const [token, tokenId] = maskedData;
    const tokenAsNumber = token.add(MODULUS).sub(secret.tokenMask).mod(MODULUS);
    const tokenAsHex = tokenAsNumber.toHexString().substring(2);
    const tokenAddress = "0x" + "0".repeat(40 - tokenAsHex.length) + tokenAsHex;
    return {
        tokenAddress,
        tokenId: tokenId.add(MODULUS).sub(secret.tokenIdMask).mod(MODULUS),
    }
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
