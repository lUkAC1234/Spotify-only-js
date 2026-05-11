import { PureComponent, ReactNode } from "react";

export class SVG_MicrophoneIllustration extends PureComponent<{ className?: string }> {
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
                <rect x="30" y="6" width="20" height="40" rx="10" />
                <path d="M20 36a4 4 0 0 1 8 0c0 6.6 5.4 12 12 12s12-5.4 12-12a4 4 0 0 1 8 0c0 9.7-7 17.7-16 19.6V64h6a4 4 0 0 1 0 8H30a4 4 0 0 1 0-8h6v-8.4C27 53.7 20 45.7 20 36z" />
            </svg>
        );
    }
}
