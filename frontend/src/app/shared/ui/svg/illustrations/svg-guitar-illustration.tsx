import { PureComponent, ReactNode } from "react";

export class SVG_GuitarIllustration extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M64 6 54 16l4 4-22 22a18 18 0 1 0 6 6l22-22 4 4 10-10-14-14zM26 70a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                <circle cx="26" cy="62" r="3" fill="rgba(0,0,0,0.55)" />
            </svg>
        );
    }
}
