import { PureComponent, ReactNode } from "react";

export class SVG_WavesIllustration extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M6 40c8 0 8-18 16-18s8 36 16 36 8-36 16-36 8 18 16 18" strokeWidth="6" />
                <path d="M6 56c6 0 6-10 12-10s6 20 12 20" strokeWidth="3" opacity="0.6" />
            </svg>
        );
    }
}
