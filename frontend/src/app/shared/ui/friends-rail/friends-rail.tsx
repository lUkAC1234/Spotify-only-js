import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { SocialService } from "@/app/core/services/social/social.service";
import { inject } from "@/app/shared/decorators/di";
import { Avatar } from "@/app/shared/ui/avatar/avatar";
import { NavLink } from "@/app/shared/ui/link/nav-link";
import { SidePanel } from "@/app/shared/ui/side-panel/side-panel";

import { FriendsPanelService } from "./friends-panel.service";
import styles from "./friends-rail.module.scss";

@observer
export class FriendsRail extends Component {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private social: SocialService = inject(SocialService);
    private panel: FriendsPanelService = inject(FriendsPanelService);

    render(): ReactNode {
        if (!this.auth.isAuthenticated) return null;
        const items = this.social.friendsActivity;
        const { isOpen } = this.panel;

        return (
            <SidePanel
                isOpen={isOpen}
                title={this.locale.t("common", "social.friend-activity")}
                onClose={this.panel.close}
                ariaLabel={this.locale.t("common", "social.friend-activity")}
            >
                {items.length === 0 ? (
                    <p className={styles["rail__empty"]}>
                        {this.locale.t("common", "social.friend-activity-empty")}
                    </p>
                ) : (
                    <ul className={styles["rail__list"]}>
                        {items.map((entry) => (
                            <li key={entry.user.id} className={styles["rail__item"]}>
                                <NavLink
                                    to={`/user/${entry.user.id}`}
                                    baseClass={styles["rail__link"]}
                                    onClick={this.panel.close}
                                >
                                    <div className={styles["rail__avatar"]}>
                                        <Avatar
                                            name={entry.user.displayName || entry.user.username || "?"}
                                            image={entry.user.avatar}
                                        />
                                    </div>
                                    <div className={styles["rail__meta"]}>
                                        <span className={styles["rail__name"]}>
                                            {entry.user.displayName || entry.user.username}
                                        </span>
                                        <span className={styles["rail__track"]}>{entry.track.title}</span>
                                        <span className={styles["rail__artist"]}>
                                            {entry.track.artist?.name ?? ""}
                                        </span>
                                    </div>
                                    {entry.isPlaying && (
                                        <span className={styles["rail__indicator"]} aria-hidden="true" />
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                )}
            </SidePanel>
        );
    }
}
