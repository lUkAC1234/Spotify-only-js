import { PureComponent, ReactNode } from "react";

export class SVG_SpotifyBadge extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="32"
                height="32"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle cx="16" cy="16" r="16" fill="#1ED760" />
                <path
                    fill="#000000"
                    d="M22.74 22.32a.84.84 0 0 1-1.15.28c-3.14-1.92-7.1-2.36-11.76-1.3a.84.84 0 1 1-.37-1.64c5.1-1.16 9.48-.65 12.99 1.5.4.24.52.78.29 1.16zm1.66-3.7a1.05 1.05 0 0 1-1.44.34c-3.6-2.21-9.08-2.85-13.34-1.56a1.05 1.05 0 1 1-.61-2.01c4.86-1.48 10.9-.76 15.04 1.78.5.3.66.95.35 1.45zm.16-3.85c-4.3-2.55-11.4-2.79-15.5-1.54a1.26 1.26 0 1 1-.73-2.41c4.7-1.43 12.55-1.15 17.51 1.78a1.26 1.26 0 1 1-1.28 2.17z"
                />
            </svg>
        );
    }
}
