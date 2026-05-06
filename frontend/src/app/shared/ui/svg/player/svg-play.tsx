import { PureComponent, ReactNode } from "react";

export class SVG_Play extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M7.05 3.606 20.4 11.21a.91.91 0 0 1 0 1.58L7.05 20.394a.91.91 0 0 1-1.367-.79V4.396a.91.91 0 0 1 1.367-.79Z" />
            </svg>
        );
    }
}
