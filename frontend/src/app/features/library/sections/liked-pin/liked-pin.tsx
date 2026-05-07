import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SVG_HeartFilled } from "@/app/shared/ui/svg/player/svg-heart-filled";

import styles from "./liked-pin.module.scss";

interface Props {
    total: number;
}

export class LikedPin extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const { total } = this.props;
        return (
            <NavLink to="/library/liked" baseClass={styles["liked-pin"]}>
                <div className={styles["liked-pin__cover"]}>
                    <SVG_HeartFilled />
                </div>
                <div className={styles["liked-pin__meta"]}>
                    <span className={styles["liked-pin__title"]}>
                        {this.locale.t("common", "library.liked-songs")}
                    </span>
                    <span className={styles["liked-pin__subtitle"]}>
                        {this.locale.t("common", "library.liked-count", { count: total })}
                    </span>
                </div>
            </NavLink>
        );
    }
}
