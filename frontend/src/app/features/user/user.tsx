import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { useParams } from "react-router";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";

import styles from "./user.module.scss";
import { UserHero } from "./sections/user-hero/user-hero";
import { UserPageService } from "./user.service";
import { UserPlaylists } from "./sections/user-playlists/user-playlists";

interface Props {
    userId: string;
}

@observer
class UserView extends Component<Props> {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: UserPageService = inject(UserPageService);

    componentDidMount(): void {
        this.title.construct({ title: "Profile", titleNamespace: "common", titleTKey: "profile.label" });
        this.title.init();
        void this.service.load(this.props.userId);
    }

    componentDidUpdate(prev: Props): void {
        if (prev.userId !== this.props.userId) {
            void this.service.load(this.props.userId);
        }
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    render(): ReactNode {
        if (this.service.isLoading && !this.service.profile) {
            return (
                <div className={styles["user__notice"]}>
                    <p>{this.locale.t("common", "loading")}</p>
                </div>
            );
        }
        if (!this.service.profile) {
            return (
                <div className={styles["user__notice"]}>
                    <p>{this.locale.t("common", "profile.not-found")}</p>
                </div>
            );
        }

        return (
            <div className={styles["user"]}>
                <UserHero profile={this.service.profile} onToggleFollow={() => this.service.toggleFollow()} />
                <UserPlaylists playlists={this.service.playlists} />
            </div>
        );
    }
}

export class User extends Component {
    render(): ReactNode {
        return <UserRouted />;
    }
}

const UserRouted = (): ReactNode => {
    const params = useParams();
    const userId = params.userId ?? "";
    if (!userId) return null;
    return <UserView key={userId} userId={userId} />;
};
