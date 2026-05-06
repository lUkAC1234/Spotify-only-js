import { PureComponent, ReactNode } from "react";

import { PropsWithClassName } from "@/app/shared/types/react-types";

export class SVG_CloseIcon extends PureComponent<PropsWithClassName> {
    render(): ReactNode {
        return (
            <svg
                className={this.props.className}
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g id="fi:x">
                    <path
                        id="Vector"
                        d="M24 8L8 24"
                        stroke="var(--text-color)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        id="Vector_2"
                        d="M8 8L24 24"
                        stroke="var(--text-color)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </g>
            </svg>
        );
    }
}
