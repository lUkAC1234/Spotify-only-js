import { PureComponent, ReactNode } from "react";

export class SVG_HeadphonesIllustration extends PureComponent<{ className?: string }> {
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
                <path d="M40 8C22.9 8 9 21.9 9 39v22a8 8 0 0 0 8 8h6a4 4 0 0 0 4-4V46a4 4 0 0 0-4-4h-6v-3c0-12.7 10.3-23 23-23s23 10.3 23 23v3h-6a4 4 0 0 0-4 4v19a4 4 0 0 0 4 4h6a8 8 0 0 0 8-8V39c0-17.1-13.9-31-31-31z" />
            </svg>
        );
    }
}
