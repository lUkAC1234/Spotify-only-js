import { PureComponent, ReactNode } from "react";

export class SVG_LegalIllustration extends PureComponent<{ className?: string }> {
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
                <path d="M30 18h44a8 8 0 0 1 8 8v68a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8z" />
                <path d="M38 36h28" opacity="0.65" />
                <path d="M38 50h36" opacity="0.65" />
                <path d="M38 64h28" opacity="0.65" />
                <path d="M38 78h22" opacity="0.65" />
                <circle cx="86" cy="92" r="14" fill="var(--surface)" />
                <path d="M81 92l4 4 8-9" />
            </svg>
        );
    }
}
