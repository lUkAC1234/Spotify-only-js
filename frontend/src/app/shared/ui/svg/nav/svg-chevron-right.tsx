import { PureComponent, ReactNode } from "react";

export class SVG_ChevronRight extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M6 4l4 4-4 4" />
            </svg>
        );
    }
}
