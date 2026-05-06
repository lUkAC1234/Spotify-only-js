import { PureComponent, ReactNode } from "react";

interface Props {
    className?: string;
    active?: boolean;
}

export class SVG_Library extends PureComponent<Props> {
    render(): ReactNode {
        const { active } = this.props;
        return (
            <svg
                className={this.props.className}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={active ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={active ? "1.4" : "2"}
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <line x1="5" y1="3" x2="5" y2="21" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <rect x="13" y="3" width="6" height="18" rx="1" />
            </svg>
        );
    }
}
