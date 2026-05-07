import { PureComponent, ReactNode } from "react";

export class SVG_HeartPlus extends PureComponent<{ className?: string }> {
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
                <path d="M12 20.5s-7-4.6-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 8.7" />
                <line x1="18" y1="14" x2="18" y2="20" />
                <line x1="15" y1="17" x2="21" y2="17" />
            </svg>
        );
    }
}
