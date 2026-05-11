import { observer } from "mobx-react";
import { Component, ReactNode } from "react";
import { useParams } from "react-router";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { Track } from "@/app/core/types/track";
import { inject } from "@/app/shared/decorators/di";

import { PlaylistHeader } from "./sections/playlist-header/playlist-header";
import styles from "./playlist.module.scss";
import { PlaylistTrackList } from "./sections/playlist-track-list/playlist-track-list";
import { PlaylistPageService } from "./playlist.service";

interface Props {
    playlistId: string;
}

@observer
class PlaylistView extends Component<Props> {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);
    private service: PlaylistPageService = inject(PlaylistPageService);
    private player: PlayerService = inject(PlayerService);
    private navigate: NavigateService = inject(NavigateService);
    private library: LibraryService = inject(LibraryService);

    componentDidMount(): void {
        this.title.construct({ title: "Playlist", titleNamespace: "common", titleTKey: "nav.library" });
        this.title.init();
        void this.service.load(this.props.playlistId);
    }

    componentDidUpdate(prevProps: Props): void {
        if (prevProps.playlistId !== this.props.playlistId) {
            void this.service.load(this.props.playlistId);
        }
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    private handlePlayAll = (): void => {
        const tracks = this.service.tracks;
        if (tracks.length === 0) return;
        const [head, ...rest] = tracks;
        this.player.setQueue(rest);
        this.player.playTrack(head, { type: "playlist", id: this.service.detail?.id ?? null });
    };

    private handlePlayTrack = (track: Track): void => {
        const tracks = this.service.tracks;
        const startIndex = tracks.findIndex((t) => t.id === track.id);
        const upcoming = startIndex >= 0 ? tracks.slice(startIndex + 1) : [];
        this.player.setQueue(upcoming);
        this.player.playTrack(track, { type: "playlist", id: this.service.detail?.id ?? null });
    };

    private handleDelete = async (): Promise<boolean> => {
        const ok = await this.service.deletePlaylist();
        if (ok) this.navigate.navigate("/library");
        return ok;
    };

    render(): ReactNode {
        if (this.service.isLoading && !this.service.detail) {
            return (
                <div className={styles["playlist__notice"]}>
                    <p className={styles["playlist__notice-text"]}>{this.locale.t("common", "loading")}</p>
                </div>
            );
        }
        if (!this.service.detail) {
            return (
                <div className={styles["playlist__notice"]}>
                    <p className={styles["playlist__notice-text"]}>
                        {this.locale.t("common", "playlist.not-found")}
                    </p>
                </div>
            );
        }
        const detail = this.service.detail;

        return (
            <div className={styles["playlist"]}>
                <PlaylistHeader
                    detail={detail}
                    onPlay={this.handlePlayAll}
                    onMetaChange={(patch) => this.service.patchMeta(patch)}
                    onAfterSave={(id) => void this.service.load(String(id))}
                    onDelete={this.handleDelete}
                    isDeleting={this.library.isPlaylistBusy(detail.id)}
                />
                <PlaylistTrackList
                    detail={detail}
                    onPlayTrack={this.handlePlayTrack}
                    onReorder={(itemId, toIndex) => this.service.reorderItem(itemId, toIndex)}
                    onRemove={(itemId) => this.service.removeItem(itemId)}
                />
            </div>
        );
    }
}

export class Playlist extends Component {
    render(): ReactNode {
        return <PlaylistRouted />;
    }
}

const PlaylistRouted = (): ReactNode => {
    const params = useParams();
    const playlistId = params.playlistId ?? "";
    if (!playlistId) return null;
    return <PlaylistView key={playlistId} playlistId={playlistId} />;
};
