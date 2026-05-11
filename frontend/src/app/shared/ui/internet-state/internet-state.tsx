import "./internet-state.scss";

import { reaction } from "mobx";
import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { ConnectionService } from "@/app/core/services/connection.service";
import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { SVG_WifiSlash } from "@/app/shared/ui/svg/svg-wifi-slash";
import { SVG_WifiStable } from "@/app/shared/ui/svg/svg-wifi-stable";
import { className } from "@/app/shared/utils/functions/className";

import { AlertService } from "../alerts/alert.service";

@observer
export class InternetState extends Component {
    locale: LocaleService = inject(LocaleService);
    connection: ConnectionService = inject(ConnectionService);
    alertService: AlertService = inject(AlertService);
    disposable: DisposableService = inject(DisposableService);

    get computedOnlineStateClassName(): string {
        return className("internet-state", {
            "internet-state--active": !this.connection.isOnline,
        });
    }

    get svgContainerClass(): string {
        return className("svg-container", {
            "svg-container--no-wifi": !this.connection.isOnline,
            "svg-container--wifi": this.connection.isOnline,
        });
    }

    componentDidMount(): void {
        this.disposable.register(
            "internet-state",
            reaction(
                () => this.connection.isOnline,
                () => {
                    if (!this.connection.isOnline) {
                        this.alertService.warning(this.locale.t("common", "no-internet"), {
                            delay: 5000,
                        });
                    }
                },
            ),
        );
    }

    componentWillUnmount(): void {
        this.disposable.dispose();
    }

    render(): ReactNode {
        return (
            <div className={this.computedOnlineStateClassName}>
                <div className={this.svgContainerClass}>
                    <SVG_WifiStable id="wifi" />
                    <SVG_WifiSlash id="no-wifi" />
                </div>
            </div>
        );
    }
}
