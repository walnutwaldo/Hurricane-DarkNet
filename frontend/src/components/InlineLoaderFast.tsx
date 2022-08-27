import React from "react";

class InlineLoaderFast extends React.Component<any, any> {

    interval: any;

    constructor(props: any) {
        super(props);
        this.state = {dots: 2};
    }

    componentDidMount() {
        this.interval = setInterval(() => {
            this.setState((prevState: any) => ({
                dots: (prevState.dots + 1) % 4
            }));
        }, 300);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        const arr = new Array(3).fill(0);
        return (
            <span>
                {
                    arr.map((v, index) => {
                        return (
                            <span key={index} className={index >= this.state.dots ? 'invisible' : 'visible'}>.</span>
                        )
                    })
                }
            </span>
        );
    }

}

export default InlineLoaderFast;
