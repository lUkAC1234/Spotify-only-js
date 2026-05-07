import { PureComponent, ReactNode } from "react";

export class SVG_Album extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="0.6" fill="currentColor" />
            </svg>
        );
    }
}
