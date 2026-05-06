import { PureComponent, ReactNode } from "react";

export class SVG_Logo extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle cx="16" cy="16" r="16" fill="currentColor" />
                <path
                    d="M9 12.5c4.5-1 9.5-0.7 13.5 1.2"
                    stroke="#000"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M9.5 16.2c3.8-0.8 8 -0.5 11.5 1.4"
                    stroke="#000"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                />
                <path
                    d="M10 19.7c3-0.6 6.5-0.4 9.4 1.1"
                    stroke="#000"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                />
            </svg>
        );
    }
}
