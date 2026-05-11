import { PureComponent, ReactNode } from "react";

export class SVG_EqualizerIllustration extends PureComponent<{ className?: string }> {
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
                <rect x="6" y="46" width="10" height="28" rx="3" />
                <rect x="22" y="28" width="10" height="46" rx="3" />
                <rect x="38" y="14" width="10" height="60" rx="3" />
                <rect x="54" y="34" width="10" height="40" rx="3" />
                <rect x="70" y="22" width="6" height="52" rx="3" />
            </svg>
        );
    }
}
