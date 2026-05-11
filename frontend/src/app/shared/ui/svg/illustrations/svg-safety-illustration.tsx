import { PureComponent, ReactNode } from "react";

export class SVG_SafetyIllustration extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M60 14 22 30v26c0 23 16 42 38 50 22-8 38-27 38-50V30L60 14z" />
                <path d="M44 60l12 12 22-26" />
            </svg>
        );
    }
}
