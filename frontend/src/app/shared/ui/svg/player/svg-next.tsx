import { PureComponent, ReactNode } from "react";

export class SVG_Next extends PureComponent<{ className?: string }> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path d="M17 4.5h2v15h-2z" />
                <path d="M4.5 4.94 14.94 11.16a1 1 0 0 1 0 1.68L4.5 19.06A1 1 0 0 1 3 18.22V5.78a1 1 0 0 1 1.5-.84Z" />
            </svg>
        );
    }
}
