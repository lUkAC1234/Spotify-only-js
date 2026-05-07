import { PureComponent, ReactNode } from "react";

export class SVG_Info extends PureComponent<{ className?: string }> {
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
                <line x1="12" y1="11" x2="12" y2="16" />
                <circle cx="12" cy="8" r="0.8" fill="currentColor" />
            </svg>
        );
    }
}
