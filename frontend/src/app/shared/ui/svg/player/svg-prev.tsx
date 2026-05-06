import { PureComponent, ReactNode } from "react";

export class SVG_Prev extends PureComponent<{ className?: string }> {
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
                <path d="M5 4.5h2v15H5z" />
                <path d="M19.5 4.94 9.06 11.16a1 1 0 0 0 0 1.68l10.44 6.22A1 1 0 0 0 21 18.22V5.78a1 1 0 0 0-1.5-.84Z" />
            </svg>
        );
    }
}
