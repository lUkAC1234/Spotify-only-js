import { PureComponent, ReactNode } from "react";

export class SVG_PrivacyIllustration extends PureComponent<{ className?: string }> {
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
                <rect x="22" y="50" width="76" height="56" rx="8" />
                <path d="M40 50V36a20 20 0 0 1 40 0v14" />
                <circle cx="60" cy="74" r="6" fill="currentColor" />
                <path d="M60 80v12" />
            </svg>
        );
    }
}
