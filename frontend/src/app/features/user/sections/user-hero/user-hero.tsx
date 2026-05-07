import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { PublicUser } from "@/app/core/types/user";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import styles from "./user-hero.module.scss";

interface Props {
    profile: PublicUser;
    onToggleFollow: () => void;
}

@observer
export class UserHero extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);

    render(): ReactNode {
        const { profile, onToggleFollow } = this.props;
        const followLabel = profile.isFollowing
            ? this.locale.t("common", "profile.unfollow")
            : this.locale.t("common", "profile.follow");

        return (
            <header className={styles["hero"]}>
                <div className={styles["hero__shade"]} aria-hidden="true" />
                <div className={styles["hero__inner"]}>
                    <div className={styles["hero__avatar"]}>
                        {profile.avatar && <img src={profile.avatar} alt="" loading="lazy" />}
                    </div>
                    <div className={styles["hero__meta"]}>
                        <span className={styles["hero__overline"]}>
                            {this.locale.t("common", "profile.label")}
                        </span>
                        <h1 className={styles["hero__name"]}>{profile.displayName || profile.username}</h1>
                        {profile.bio && <p className={styles["hero__bio"]}>{profile.bio}</p>}
                        <div className={styles["hero__line"]}>
                            <span>
                                {this.locale.t("common", "profile.followers", {
                                    count: profile.followersCount,
                                })}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span>
                                {this.locale.t("common", "profile.following", {
                                    count: profile.followingCount,
                                })}
                            </span>
                        </div>
                        {!profile.isSelf && this.auth.isAuthenticated && (
                            <div className={styles["hero__actions"]}>
                                <button
                                    type="button"
                                    className={className(styles["hero__follow"], {
                                        [styles["hero__follow--active"]]: profile.isFollowing,
                                    })}
                                    onClick={onToggleFollow}
                                    aria-pressed={profile.isFollowing}
                                >
                                    {followLabel}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        );
    }
}
