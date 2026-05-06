import { PureComponent, ReactNode } from "react";

interface Props {
    className?: string;
    active?: boolean;
}

export class SVG_Home extends PureComponent<Props> {
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
                <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
            </svg>
        );
    }
}
