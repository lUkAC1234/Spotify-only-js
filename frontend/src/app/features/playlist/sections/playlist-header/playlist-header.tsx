import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { PlaylistDetail } from "@/app/core/types/playlist";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { ConfirmDialog } from "@/app/shared/ui/confirm-dialog/confirm-dialog";
import { CreatePlaylistModalService } from "@/app/shared/ui/create-playlist-modal/create-playlist-modal.service";
import { SVG_Play } from "@/app/shared/ui/svg/player/svg-play";

import styles from "./playlist-header.module.scss";

interface Props {
    detail: PlaylistDetail;
    onPlay: () => void;
    onMetaChange: (patch: { isCollaborative?: boolean }) => Promise<void> | void;
    onAfterSave: (id: number) => void;
    onDelete: () => Promise<boolean>;
    isDeleting: boolean;
}

interface State {
    confirmDelete: boolean;
}

const formatDuration = (ms: number): string => {
    if (!Number.isFinite(ms) || ms <= 0) return "0 min";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
        return `${hours} h ${minutes} min`;
    }
    return `${minutes} min`;
};

@observer
export class PlaylistHeader extends Component<Props, State> {
    private locale: LocaleService = inject(LocaleService);
    private editModal: CreatePlaylistModalService = inject(CreatePlaylistModalService);

    state: State = { confirmDelete: false };

    private startEdit = (): void => {
        this.editModal.openEdit(this.props.detail, this.props.onAfterSave);
    };

    private handleEditCover = (): void => {
        this.editModal.openEdit(this.props.detail, this.props.onAfterSave);
    };

    private handleToggleCollab = async (): Promise<void> => {
        await this.props.onMetaChange({
            isCollaborative: !this.props.detail.isCollaborative,
        });
    };

    private openDeleteConfirm = (): void => {
        this.setState({ confirmDelete: true });
    };

    private closeDeleteConfirm = (): void => {
        if (this.props.isDeleting) return;
        this.setState({ confirmDelete: false });
    };

    private handleConfirmDelete = async (): Promise<void> => {
        const ok = await this.props.onDelete();
        if (ok) this.setState({ confirmDelete: false });
    };

    render(): ReactNode {
        const { detail } = this.props;
        const cover = detail.cover || "";
        const ownerName = detail.owner.displayName || detail.owner.username;

        return (
            <header className={styles["playlist-header"]}>
                <button
                    type="button"
                    className={className(styles["playlist-header__cover"], {
                        [styles["playlist-header__cover--editable"]]: detail.canEdit,
                    })}
                    onClick={detail.canEdit ? this.handleEditCover : undefined}
                    disabled={!detail.canEdit}
                    aria-label={detail.canEdit ? this.locale.t("common", "playlist.edit-cover") : undefined}
                >
                    {cover && <img src={cover} alt="" loading="lazy" />}
                    {detail.canEdit && (
                        <span className={styles["playlist-header__cover-overlay"]}>
                            {this.locale.t("common", "playlist.edit-cover")}
                        </span>
                    )}
                </button>
                <div className={styles["playlist-header__meta"]}>
                    <span className={styles["playlist-header__overline"]}>
                        {detail.isSystem
                            ? this.locale.t("common", "playlist.system")
                            : this.locale.t("common", "playlist.label")}
                    </span>

                    <h1
                        className={className(styles["playlist-header__title"], {
                            [styles["playlist-header__title--editable"]]: detail.canEdit,
                        })}
                        onClick={detail.canEdit ? this.startEdit : undefined}
                        role={detail.canEdit ? "button" : undefined}
                        tabIndex={detail.canEdit ? 0 : undefined}
                        onKeyDown={detail.canEdit ? (e) => { if (e.key === "Enter") this.startEdit(); } : undefined}
                    >
                        {detail.title}
                    </h1>
                    {detail.description && (
                        <p className={styles["playlist-header__description"]}>{detail.description}</p>
                    )}

                    <div className={styles["playlist-header__line"]}>
                        <span className={styles["playlist-header__owner"]}>{ownerName}</span>
                        <span aria-hidden="true">•</span>
                        <span>
                            {this.locale.t("common", "playlist.tracks-count", { count: detail.totalTracks })}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span>{formatDuration(detail.totalDurationMs)}</span>
                    </div>

                    <div className={styles["playlist-header__actions"]}>
                        <button
                            type="button"
                            className={styles["playlist-header__play"]}
                            onClick={this.props.onPlay}
                            disabled={detail.totalTracks === 0}
                            aria-label={this.locale.t("common", "player.play")}
                        >
                            <SVG_Play />
                        </button>
                        {detail.canEdit && (
                            <button
                                type="button"
                                className={styles["playlist-header__secondary"]}
                                onClick={this.startEdit}
                            >
                                {this.locale.t("common", "playlist.edit")}
                            </button>
                        )}
                        {detail.canEdit && !detail.isSystem && (
                            <button
                                type="button"
                                className={className(styles["playlist-header__secondary"], {
                                    [styles["playlist-header__secondary--active"]]: detail.isCollaborative,
                                })}
                                onClick={this.handleToggleCollab}
                            >
                                {detail.isCollaborative
                                    ? this.locale.t("common", "playlist.collaborative-on")
                                    : this.locale.t("common", "playlist.collaborative-off")}
                            </button>
                        )}
                        {detail.canEdit && !detail.isSystem && (
                            <button
                                type="button"
                                className={styles["playlist-header__danger"]}
                                onClick={this.openDeleteConfirm}
                            >
                                {this.locale.t("common", "playlist.delete")}
                            </button>
                        )}
                    </div>
                </div>

                <ConfirmDialog
                    isOpen={this.state.confirmDelete}
                    title={this.locale.t("common", "playlist.delete-confirm-title")}
                    description={this.locale.t("common", "playlist.delete-confirm-body", {
                        title: detail.title,
                    })}
                    confirmLabel={this.locale.t("common", "playlist.delete-confirm-yes")}
                    cancelLabel={this.locale.t("common", "playlist.delete-confirm-cancel")}
                    busyLabel={this.locale.t("common", "playlist.deleting")}
                    isBusy={this.props.isDeleting}
                    danger
                    onCancel={this.closeDeleteConfirm}
                    onConfirm={this.handleConfirmDelete}
                />
            </header>
        );
    }
}
