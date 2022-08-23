import React, {useContext, useReducer, useState} from 'react';
import {BigNumber} from "ethers";
import SecretContext, {Deposit} from './contexts/SecretContext';
import {PrimaryButton, SecondaryButton} from "./components/buttons";
import {DepositSection} from "./sections/DepositSection";
import {WithdrawSection} from "./sections/WithdrawSection";
import {useSigner} from "wagmi";

const MODULUS = BigNumber.from("21888242871839275222246405745257275088548364400416034343698204186575808495617");

function SecretDisplay(props: any) {
    const {secret} = props;
    const [enableCopy, setEnableCopy] = useState(true);

    return (
        <div className={"flex flex-row gap-2"}>
            <SecondaryButton onClick={() => {
                // Copy secret.toHexString() to clipboard
                navigator.clipboard.writeText(secret!.toHexString());
                setEnableCopy(false);
                setTimeout(() => {
                    setEnableCopy(true);
                }, 1000);
            }} disabled={!enableCopy}>
                {enableCopy ? "Copy" : "Copied!"}
            </SecondaryButton>
            <   span className={"px-1 bg-zinc-100 text-zinc-900 rounded-md font-mono"}>
                {secret.toHexString()}
            </span>
        </div>
    )
}

function GenerateSecretSection() {
    const {secret, setSecret} = useContext(SecretContext);
    const [enableCopy, setEnableCopy] = useState(true);

    return (<div className={"mb-3"}>
        <h3 className={"text-lg text-black font-bold"}>
            GENERATE A SECRET
        </h3>
        <div className="flex flex-row gap-2">
            <PrimaryButton onClick={() => {
                const randomBytes = crypto.getRandomValues(new Uint32Array(10));
                // Concatenate into hex string
                const secretString = randomBytes.reduce((acc, cur) => acc + cur.toString(16), "");
                const secret = BigNumber.from("0x" + secretString).mod(MODULUS);
                setSecret!(secret);
            }}>
                Generate
            </PrimaryButton>
            {(secret !== undefined) && (<SecretDisplay secret={secret}/>)}
        </div>
    </div>)
}

function DepositsSection() {
    const {deposits} = useContext(SecretContext);

    return (<div className={"mb-3"}>
        <h3 className={"text-lg text-black font-bold"}>
            YOUR DEPOSITS
        </h3>
        <div>
            {
                deposits.map(function (deposit, idx) {
                    return (
                        <div key={idx}>
                            <SecretDisplay secret={deposit.secret}/>
                        </div>
                    )
                })
            }
        </div>
    </div>)
}

const DEPOSITS_LOCALHOST_KEY = 'hurricane_deposits';

export default function Content() {
    const [secret, setSecret] = useState<BigNumber | undefined>(undefined);

    const {data: signer, isError, isLoading} = useSigner();
    console.log("signer", signer);

    const [deposits, setDeposits] = useState(
        JSON.parse(localStorage.getItem(DEPOSITS_LOCALHOST_KEY) || '[]').map((depositJson: any) => ({
            secret: BigNumber.from(depositJson.secret),
            leaf: BigNumber.from(depositJson.leaf)
        }))
    );

    function saveDeposits(newDeposits: Deposit[]) {
        localStorage.setItem(DEPOSITS_LOCALHOST_KEY, JSON.stringify(
            newDeposits.map((deposit) => ({
                secret: deposit.secret.toString(),
                leaf: deposit.leaf.toString()
            }))
        ));
    }

    function addDeposit(newDeposit: Deposit) {
        const newDeposits = [...deposits, newDeposit];
        saveDeposits(newDeposits);
        setDeposits(newDeposits);
    }

    function removeDeposit(idx: number) {
        const newDeposits = [...deposits];
        newDeposits.splice(idx, 1);
        saveDeposits(newDeposits);
        setDeposits(newDeposits);
    }

    return (
        <SecretContext.Provider value={{
            secret,
            setSecret,
            deposits: deposits,
            addDeposit: addDeposit,
            removeDeposit
        }}>
            <GenerateSecretSection/>
            {deposits.length > 0 && <DepositsSection/>}
            {signer ? <div className="grid grid-cols-2 gap-2">
                <DepositSection/>
                <WithdrawSection/>
            </div> : <div className={"font-bold text-red-500 text-2xl text-center"}>
                Connect your wallet to be able to interact with Hurricane.
            </div>}
        </SecretContext.Provider>
    );
}
