import React from "react";

export function PrimaryButton(props: any) {
    const {onClick, children, disabled} = props;

    return (
        <button className={
            "outline-none enabled:bg-lightgreen disabled:display-none text-darkgreen rounded-md px-1 transition" +
            " enabled:hover:scale-105 font-bold"
        } onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )
}

export function SecondaryButton(props: any) {
    const {onClick, children, disabled} = props;

    return (
        <button className={
            "outline-none enabled:bg-zinc-400 disabled:display-none text-white rounded-md px-1 transition" +
            " enabled:hover:scale-105 font-bold"
        } onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )
}

export function AlertButton(props: any) {
    const {onClick, children, disabled} = props;

    return (
        <button className={
            "outline-none enabled:bg-red-500 disabled:bg-red-1000 text-black rounded-md px-1 transition" +
            " enabled:hover:scale-105 font-bold"
        } onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )
}
