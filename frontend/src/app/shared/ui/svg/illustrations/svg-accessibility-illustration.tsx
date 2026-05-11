import { PureComponent, ReactNode } from "react";

export class SVG_AccessibilityIllustration extends PureComponent<{ className?: string }> {
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
                <circle cx="60" cy="60" r="48" />
                <circle cx="60" cy="32" r="6" fill="currentColor" />
                <path d="M40 46h40" />
                <path d="M60 46v22" />
                <path d="M60 68l-10 28" />
                <path d="M60 68l10 28" />
            </svg>
        );
    }
}
