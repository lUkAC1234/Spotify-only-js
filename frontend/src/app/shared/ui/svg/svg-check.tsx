import { PureComponent, ReactNode } from "react";

export class SVG_Check extends PureComponent {
    render(): ReactNode {
        return (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10 17.5C5.8575 17.5 2.5 14.1425 2.5 10C2.5 5.8575 5.8575 2.5 10 2.5C14.1425 2.5 17.5 5.8575 17.5 10C17.5 14.1425 14.1425 17.5 10 17.5Z"
                    fill="#0BC33F"
                />
                <path
                    d="M13.3337 8.33334L9.16699 12.5L6.66699 10"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
}
