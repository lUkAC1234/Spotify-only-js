import { observer } from "mobx-react";
import { ChangeEvent, Component, FormEvent, ReactNode, createRef } from "react";

import { LibraryService } from "@/app/core/services/library/library.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { NavigateService } from "@/app/core/services/navigate.service";
import { inject } from "@/app/shared/decorators/di";
import { Spinner } from "@/app/shared/ui/loaders/spinner";
import { SVG_Camera } from "@/app/shared/ui/svg/nav/svg-camera";
import { SVG_MusicNote } from "@/app/shared/ui/svg/nav/svg-music-note";
import { SVG_Pencil } from "@/app/shared/ui/svg/nav/svg-pencil";
import { SVG_CloseIcon } from "@/app/shared/ui/svg/svg-close-icon";

import { CreatePlaylistModalService } from "./create-playlist-modal.service";
import styles from "./create-playlist-modal.module.scss";

interface State {
    title: string;
    description: string;
    coverFile: File | null;
    coverPreview: string;
    isSubmitting: boolean;
    error: string;
    isMounted: boolean;
    backdropArmed: boolean;
}

const INITIAL_STATE: State = {
    title: "",
    description: "",
    coverFile: null,
    coverPreview: "",
    isSubmitting: false,
    error: "",
    isMounted: false,
    backdropArmed: false,
};

@observer
export class CreatePlaylistModal extends Component<object, State> {
    private locale: LocaleService = inject(LocaleService);
    private modal: CreatePlaylistModalService = inject(CreatePlaylistModalService);
    private library: LibraryService = inject(LibraryService);
    private navigate: NavigateService = inject(NavigateService);
    private fileRef = createRef<HTMLInputElement>();
    private hydrationKey: number | null = null;

    state: State = INITIAL_STATE;

    componentDidUpdate(): void {
        const editing = this.modal.editing;
        const editingKey = editing?.id ?? -1;
        const isOpen = this.modal.isOpen;

        if (isOpen && this.hydrationKey !== editingKey) {
            this.hydrationKey = editingKey;
            if (editing) {
                this.setState({
                    title: editing.title,
                    description: editing.description,
                    coverFile: null,
                    coverPreview: editing.cover,
                    error: "",
                });
            } else {
                this.setState({ ...INITIAL_STATE });
            }
        }

        if (!isOpen && this.hydrationKey !== null) {
            this.hydrationKey = null;
            if (this.state.coverPreview && this.state.coverPreview.startsWith("blob:")) {
                URL.revokeObjectURL(this.state.coverPreview);
            }
        }
    }

    componentWillUnmount(): void {
        if (this.state.coverPreview && this.state.coverPreview.startsWith("blob:")) {
            URL.revokeObjectURL(this.state.coverPreview);
        }
    }

    private handleTitle = (event: ChangeEvent<HTMLInputElement>): void => {
        this.setState({ title: event.target.value, error: "" });
    };

    private handleDescription = (event: ChangeEvent<HTMLTextAreaElement>): void => {
        this.setState({ description: event.target.value });
    };

    private handlePickCover = (): void => {
        this.fileRef.current?.click();
    };

    private handleCoverChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            this.setState({ error: this.locale.t("common", "playlist.cover-too-large") });
            return;
        }
        if (this.state.coverPreview && this.state.coverPreview.startsWith("blob:")) {
            URL.revokeObjectURL(this.state.coverPreview);
        }
        const preview = URL.createObjectURL(file);
        this.setState({ coverFile: file, coverPreview: preview, error: "" });
    };

    private handleClose = (): void => {
        if (this.state.isSubmitting) return;
        if (this.state.coverPreview && this.state.coverPreview.startsWith("blob:")) {
            URL.revokeObjectURL(this.state.coverPreview);
        }
        this.modal.close();
    };

    private handleBackdropMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
        this.setState({ backdropArmed: event.target === event.currentTarget });
    };

    private handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>): void => {
        const armed = this.state.backdropArmed;
        this.setState({ backdropArmed: false });
        if (armed && event.target === event.currentTarget) {
            this.handleClose();
        }
    };

    private handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        const title = this.state.title.trim();
        if (!title) {
            this.setState({ error: this.locale.t("common", "playlist.title-required") });
            return;
        }
        this.setState({ isSubmitting: true, error: "" });
        const editing = this.modal.editing;
        const description = this.state.description.trim();

        try {
            if (editing) {
                const updated = await this.library.updatePlaylist(editing.id, { title, description });
                if (!updated) {
                    this.setState({ error: this.locale.t("common", "playlist.update-error"), isSubmitting: false });
                    return;
                }
                if (this.state.coverFile) {
                    const coverResult = await this.library.uploadPlaylistCover(editing.id, this.state.coverFile);
                    if (!coverResult) {
                        this.setState({
                            error: this.locale.t("common", "playlist.cover-error"),
                            isSubmitting: false,
                        });
                        return;
                    }
                }
                this.setState({ isSubmitting: false });
                this.modal.notifySaved(editing.id);
                this.modal.close();
                return;
            }

            const created = await this.library.createPlaylist(title, description);
            if (!created) {
                this.setState({ error: this.locale.t("common", "playlist.create-error"), isSubmitting: false });
                return;
            }
            if (this.state.coverFile) {
                const coverResult = await this.library.uploadPlaylistCover(created.id, this.state.coverFile);
                if (!coverResult) {
                    this.setState({
                        error: this.locale.t("common", "playlist.cover-error"),
                        isSubmitting: false,
                    });
                    return;
                }
            }
            this.setState({ isSubmitting: false });
            this.modal.close();
            this.navigate.navigate(`/playlist/${created.id}`);
        } catch {
            this.setState({ isSubmitting: false, error: this.locale.t("common", "error") });
        }
    };

    render(): ReactNode {
        if (!this.modal.isOpen) return null;
        const editing = this.modal.editing;
        const { title, description, coverPreview, isSubmitting, error } = this.state;
        const titleLabel = editing
            ? this.locale.t("common", "playlist.edit")
            : this.locale.t("common", "playlist.create");
        const submitLabel = editing
            ? this.locale.t("common", "playlist.save")
            : this.locale.t("common", "playlist.create-cta");
        const submittingLabel = editing
            ? this.locale.t("common", "playlist.saving")
            : this.locale.t("common", "playlist.creating");

        return (
            <div
                className={styles["modal"]}
                onMouseDown={this.handleBackdropMouseDown}
                onClick={this.handleBackdropClick}
                role="dialog"
                aria-modal="true"
            >
                <div className={styles["modal__panel"]}>
                    <header className={styles["modal__header"]}>
                        <h2 className={styles["modal__title"]}>{titleLabel}</h2>
                        <button
                            type="button"
                            className={styles["modal__close"]}
                            onClick={this.handleClose}
                            aria-label={this.locale.t("common", "playlist.close")}
                        >
                            <SVG_CloseIcon />
                        </button>
                    </header>

                    <form className={styles["modal__form"]} onSubmit={this.handleSubmit}>
                        <div className={styles["modal__body"]}>
                            <button
                                type="button"
                                className={styles["modal__cover"]}
                                onClick={this.handlePickCover}
                                aria-label={this.locale.t("common", "playlist.cover-aria")}
                            >
                                {coverPreview ? (
                                    <img
                                        className={styles["modal__cover-img"]}
                                        src={coverPreview}
                                        alt=""
                                    />
                                ) : (
                                    <SVG_MusicNote className={styles["modal__cover-placeholder"]} />
                                )}
                                <span className={styles["modal__cover-overlay"]}>
                                    <SVG_Camera className={styles["modal__cover-overlay-icon"]} />
                                    <span className={styles["modal__cover-overlay-text"]}>
                                        {this.locale.t("common", "playlist.choose-cover")}
                                    </span>
                                </span>
                            </button>
                            <input
                                ref={this.fileRef}
                                type="file"
                                accept="image/*"
                                className={styles["modal__file"]}
                                onChange={this.handleCoverChange}
                            />

                            <div className={styles["modal__fields"]}>
                                <label className={styles["modal__field"]}>
                                    <span className={styles["modal__label"]}>
                                        {this.locale.t("common", "playlist.name-label")}
                                    </span>
                                    <span className={styles["modal__input-wrap"]}>
                                        <SVG_MusicNote className={styles["modal__input-icon"]} />
                                        <input
                                            type="text"
                                            className={styles["modal__input"]}
                                            value={title}
                                            onChange={this.handleTitle}
                                            maxLength={120}
                                            autoFocus
                                            placeholder={this.locale.t("common", "playlist.title-placeholder")}
                                        />
                                    </span>
                                </label>

                                <label className={styles["modal__field"]}>
                                    <span className={styles["modal__label"]}>
                                        {this.locale.t("common", "playlist.description-label")}
                                    </span>
                                    <span className={styles["modal__input-wrap"]}>
                                        <SVG_Pencil className={styles["modal__input-icon"]} />
                                        <textarea
                                            className={styles["modal__textarea"]}
                                            value={description}
                                            onChange={this.handleDescription}
                                            maxLength={320}
                                            rows={3}
                                            placeholder={this.locale.t("common", "playlist.description-placeholder")}
                                        />
                                    </span>
                                </label>

                                {error && <p className={styles["modal__error"]} role="alert">{error}</p>}
                            </div>
                        </div>

                        <footer className={styles["modal__actions"]}>
                            <button
                                type="button"
                                className={styles["modal__cancel"]}
                                onClick={this.handleClose}
                                disabled={isSubmitting}
                            >
                                {this.locale.t("common", "playlist.cancel")}
                            </button>
                            <button
                                type="submit"
                                className={styles["modal__submit"]}
                                disabled={isSubmitting}
                                aria-busy={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className={styles["modal__submit-busy"]}>
                                        <Spinner size="sm" tone="current" inline />
                                        <span>{submittingLabel}</span>
                                    </span>
                                ) : (
                                    submitLabel
                                )}
                            </button>
                        </footer>
                    </form>
                </div>
            </div>
        );
    }
}
