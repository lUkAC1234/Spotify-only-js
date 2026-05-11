import { PureComponent, ReactNode } from "react";

export class SVG_CookiesIllustration extends PureComponent<{ className?: string }> {
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
                <path d="M60 14a46 46 0 1 0 46 46 30 30 0 0 1-30-30A16 16 0 0 1 60 14z" />
                <circle cx="44" cy="54" r="4" fill="currentColor" />
                <circle cx="68" cy="44" r="3" fill="currentColor" />
                <circle cx="74" cy="74" r="4" fill="currentColor" />
                <circle cx="50" cy="80" r="3" fill="currentColor" />
                <circle cx="36" cy="68" r="3" fill="currentColor" />
            </svg>
        );
    }
}
