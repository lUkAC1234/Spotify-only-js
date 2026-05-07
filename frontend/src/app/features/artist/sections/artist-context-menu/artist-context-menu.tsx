import { observer } from "mobx-react";
import { Component, ReactNode, RefObject } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { AlertService } from "@/app/shared/ui/alerts/alert.service";
import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { PlayerService } from "@/app/core/services/player/player.service";
import { ArtistDetail } from "@/app/core/types/artist";
import { inject } from "@/app/shared/decorators/di";
import { Menu } from "@/app/shared/ui/popover/menu";
import { MenuDivider } from "@/app/shared/ui/popover/menu-divider";
import { MenuItem } from "@/app/shared/ui/popover/menu-item";
import { MenuSubmenu } from "@/app/shared/ui/popover/menu-submenu";
import { Popover } from "@/app/shared/ui/popover/popover";
import { SVG_Album } from "@/app/shared/ui/svg/menu/svg-album";
import { SVG_Desktop } from "@/app/shared/ui/svg/menu/svg-desktop";
import { SVG_HeartPlus } from "@/app/shared/ui/svg/menu/svg-heart-plus";
import { SVG_Info } from "@/app/shared/ui/svg/menu/svg-info";
import { SVG_PlusCircle } from "@/app/shared/ui/svg/menu/svg-plus-circle";
import { SVG_Radio } from "@/app/shared/ui/svg/menu/svg-radio";
import { SVG_Share } from "@/app/shared/ui/svg/menu/svg-share";

interface Props {
    detail: ArtistDetail;
    isOpen: boolean;
    anchorRef: RefObject<HTMLElement | null>;
    onClose: () => void;
    onOpenAbout: () => void;
}

@observer
export class ArtistContextMenu extends Component<Props> {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);
    private library: LibraryService = inject(LibraryService);
    private player: PlayerService = inject(PlayerService);
    private navigate: NavigateService = inject(NavigateService);
    private alert: AlertService = inject(AlertService);

    private get artistUrl(): string {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        return `${origin}/artist/${this.props.detail.id}`;
    }

    private handleAddToLiked = async (): Promise<void> => {
        if (!this.auth.isAuthenticated) {
            this.navigate.navigate("/login");
            return;
        }
        const top = this.props.detail.topTracks[0];
        if (!top) return;
        await this.library.toggleTrackSaved(top.id);
    };

    private handlePlayRadio = (): void => {
        const tracks = this.props.detail.topTracks;
        if (tracks.length === 0) return;
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        this.player.setQueue(shuffled.slice(1));
        this.player.playTrack(shuffled[0], { type: "radio", id: this.props.detail.id });
    };

    private handleGoToAlbum = (): void => {
        const current = this.player.currentTrack;
        if (!current?.album) return;
        this.navigate.navigate(`/album/${current.album.id}`);
    };

    private handleViewDetails = (): void => {
        this.props.onOpenAbout();
    };

    private handleCopyLink = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(this.artistUrl);
            this.alert.pushAlert({
                message: this.locale.t("common", "artist-menu.copied"),
                delay: 2400,
            });
        } catch {
            this.alert.pushAlert({
                message: this.locale.t("common", "error"),
                delay: 2400,
            });
        }
    };

    private handleSystemShare = async (): Promise<void> => {
        const data = { title: this.props.detail.name, url: this.artistUrl };
        if (navigator.share) {
            try {
                await navigator.share(data);
            } catch {
                // user cancelled, do nothing
            }
            return;
        }
        await this.handleCopyLink();
    };

    private handleAddToPlaylist = async (playlistId: number): Promise<void> => {
        if (!this.auth.isAuthenticated) {
            this.navigate.navigate("/login");
            return;
        }
        const trackIds = this.props.detail.topTracks.slice(0, 5).map((t) => t.id);
        if (trackIds.length === 0) return;
        await this.library.addTracksToPlaylist(playlistId, trackIds);
    };

    private renderPlaylistsSubmenu(): ReactNode {
        const playlists = this.library.myPlaylists;
        const items: ReactNode[] = [
            <MenuItem
                key="new"
                label={this.locale.t("common", "artist-menu.new-playlist")}
                icon={<SVG_PlusCircle />}
                disabled={!this.auth.isAuthenticated}
                onSelect={() => this.navigate.navigate("/library")}
            />,
        ];
        if (playlists.length > 0) {
            items.push(<MenuDivider key="divider-playlists" />);
            playlists.forEach((p) => {
                items.push(
                    <MenuItem
                        key={`p-${p.id}`}
                        label={p.title}
                        onSelect={() => this.handleAddToPlaylist(p.id)}
                    />,
                );
            });
        }
        return items;
    }

    render(): ReactNode {
        const { detail, isOpen, anchorRef, onClose } = this.props;
        const isAuthed = this.auth.isAuthenticated;
        const currentTrack = this.player.currentTrack;
        const isPlayingThisArtist =
            currentTrack !== null && currentTrack.artist?.id === detail.id;
        const goToAlbumDisabled = !isPlayingThisArtist || !currentTrack?.album;
        const hasTopTracks = detail.topTracks.length > 0;

        return (
            <Popover
                isOpen={isOpen}
                anchorRef={anchorRef}
                placement="bottom-start"
                onClose={onClose}
                label={this.locale.t("common", "artist-menu.more-aria")}
            >
                <Menu label={this.locale.t("common", "artist-menu.more-aria")} onClose={onClose}>
                    <MenuSubmenu
                        label={this.locale.t("common", "artist-menu.add-to-playlist")}
                        icon={<SVG_PlusCircle />}
                        disabled={!isAuthed || !hasTopTracks}
                    >
                        {this.renderPlaylistsSubmenu()}
                    </MenuSubmenu>
                    <MenuItem
                        label={this.locale.t("common", "artist-menu.add-to-liked")}
                        icon={<SVG_HeartPlus />}
                        disabled={!isAuthed || !hasTopTracks}
                        onSelect={() => void this.handleAddToLiked()}
                    />
                    <MenuItem
                        label={this.locale.t("common", "artist-menu.go-to-radio")}
                        icon={<SVG_Radio />}
                        disabled={!hasTopTracks}
                        onSelect={this.handlePlayRadio}
                    />
                    <MenuItem
                        label={this.locale.t("common", "artist-menu.go-to-album")}
                        icon={<SVG_Album />}
                        disabled={goToAlbumDisabled}
                        onSelect={this.handleGoToAlbum}
                    />
                    <MenuItem
                        label={this.locale.t("common", "artist-menu.view-details")}
                        icon={<SVG_Info />}
                        onSelect={this.handleViewDetails}
                    />
                    <MenuSubmenu
                        label={this.locale.t("common", "artist-menu.share")}
                        icon={<SVG_Share />}
                    >
                        <MenuItem
                            label={this.locale.t("common", "artist-menu.share-copy")}
                            onSelect={() => void this.handleCopyLink()}
                        />
                        <MenuItem
                            label={this.locale.t("common", "artist-menu.share-system")}
                            onSelect={() => void this.handleSystemShare()}
                        />
                    </MenuSubmenu>
                    <MenuDivider />
                    <MenuItem
                        label={this.locale.t("common", "artist-menu.open-in-app")}
                        icon={<SVG_Desktop />}
                        href={`spotify:artist:${detail.sourceId || detail.id}`}
                    />
                </Menu>
            </Popover>
        );
    }
}
