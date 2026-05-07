import { PureComponent, ReactNode } from "react";

export class SVG_Friends extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle cx="9" cy="8" r="3.4" />
                <path d="M3 20a6 6 0 0 1 12 0" />
                <circle cx="17" cy="9" r="2.6" />
                <path d="M15 20a4.6 4.6 0 0 1 6.5-4.2" />
            </svg>
        );
    }
}
