import { PureComponent, ReactNode } from "react";

interface Props {
    className?: string;
    active?: boolean;
}

export class SVG_Search extends PureComponent<Props> {
    render(): ReactNode {
        const { active } = this.props;
        return (
            <svg
                className={this.props.className}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? "2.4" : "2"}
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
        );
    }
}
