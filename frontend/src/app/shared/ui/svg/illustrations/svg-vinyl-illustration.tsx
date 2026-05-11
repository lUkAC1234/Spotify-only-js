import { PureComponent, ReactNode } from "react";

export class SVG_VinylIllustration extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle cx="40" cy="40" r="38" fill="currentColor" opacity="0.92" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
                <circle cx="40" cy="40" r="26" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="0.6" />
                <circle cx="40" cy="40" r="20" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" />
                <circle cx="40" cy="40" r="14" fill="rgba(0,0,0,0.6)" />
                <circle cx="40" cy="40" r="3" fill="currentColor" />
            </svg>
        );
    }
}
