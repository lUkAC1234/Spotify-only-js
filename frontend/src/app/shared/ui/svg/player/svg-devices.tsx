import { PureComponent, ReactNode } from "react";

export class SVG_Devices extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <rect x="3" y="5" width="14" height="11" rx="2" />
                <rect x="14" y="11" width="7" height="9" rx="1.5" />
                <line x1="3" y1="20" x2="11" y2="20" />
            </svg>
        );
    }
}
