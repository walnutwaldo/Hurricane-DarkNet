import React from "react";

export function PrimaryButton(props: any) {
    const {onClick, children, disabled, className} = props;

    return (
        <button className={
            className +
            " outline-none bg-lightgreen disabled:opacity-75 text-darkgreen rounded-md px-1 transition" +
            " enabled:hover:brightness-95 font-bold"
        } onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )
}

export function SecondaryButton(props: any) {
    const {onClick, children, disabled, className} = props;

    return (
        <button className={
            className + " outline-none bg-stone-200 disabled:opacity-50 text-stone-800 rounded-md px-1 transition" +
            " enabled:hover:brightness-95 font-bold"
        } onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )

}

export function TabButton(props: any) {
    const {onClick, children, disabled, className} = props;

    return (
        <button className={
            className +
            " outline-none bg-lightgreen disabled:border-4 disabled:border-darkgreen text-darkgreen rounded-xl px-1 transition" +
            " enabled:hover:brightness-95 font-semibold"
        } onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )
}

export function AlertButton(props: any) {
    const {onClick, children, disabled} = props;

    return (
        <button className={
            "outline-none enabled:bg-red-300 disabled:bg-red-1000 text-black rounded-md px-1 transition" +
            " enabled:hover:brightness-95 font-bold"
        } onClick={onClick} disabled={disabled}>
            {children}
        </button>
    )
}