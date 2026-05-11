import { PureComponent, ReactNode } from "react";

export class SVG_AdsIllustration extends PureComponent<{ className?: string }> {
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
                <path d="M28 50v20l60 22V28L28 50z" />
                <path d="M28 50H18a4 4 0 0 0-4 4v12a4 4 0 0 0 4 4h10" />
                <path d="M88 28l16-12" opacity="0.6" />
                <path d="M96 60h12" opacity="0.6" />
                <path d="M88 92l16 12" opacity="0.6" />
                <path d="M40 70v18a6 6 0 0 0 12 0V74" />
            </svg>
        );
    }
}
