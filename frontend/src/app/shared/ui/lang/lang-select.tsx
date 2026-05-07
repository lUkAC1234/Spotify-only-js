import { reaction } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef, ReactNode, RefObject } from "react";

import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { langs } from "@/locale/_utils/langs.json";

import styles from "./lang-select.module.scss";
import { LangSelectService } from "./lang-select.service";

const LANG_CODES: Record<string, string> = {
    en: "EN",
    ru: "RU",
    uz: "UZ",
};

@observer
export class LangSelect extends Component {
    selectWrapRef: RefObject<HTMLDivElement | null> = createRef();
    disposable: DisposableService = inject(DisposableService);
    langSelectService: LangSelectService = inject(LangSelectService);
    locale: LocaleService = inject(LocaleService);

    private get triggerLabel(): string {
        return LANG_CODES[this.locale.lang] ?? this.locale.lang.toUpperCase().slice(0, 2);
    }

    private outsideClickHandler = (evt: MouseEvent): void => {
        if (!this.selectWrapRef.current?.contains(evt.target as Node) && this.langSelectService.isOpen) {
            this.langSelectService.toggleDropdown();
        }
    };

    private keydownHandler = (evt: KeyboardEvent): void => {
        if (evt.key !== "Escape" || !this.langSelectService.isOpen) return;
        this.langSelectService.toggleDropdown();
    };

    componentDidMount(): void {
        this.disposable.register(
            "lang-change",
            reaction(
                () => this.locale.lang,
                () => {
                    if (this.langSelectService.isOpen) this.langSelectService.toggleDropdown();
                },
                { delay: 75 },
            ),
        );
        document.addEventListener("mousedown", this.outsideClickHandler);
        document.addEventListener("keydown", this.keydownHandler);
    }

    componentWillUnmount(): void {
        this.disposable.dispose();
        document.removeEventListener("mousedown", this.outsideClickHandler);
        document.removeEventListener("keydown", this.keydownHandler);
    }

    render(): ReactNode {
        const isOpen = this.langSelectService.isOpen;
        const ariaLabel = this.locale.t("common", "lang.aria-label");
        return (
            <div className={styles["lang-select"]} ref={this.selectWrapRef}>
                <button
                    type="button"
                    className={className(styles["lang-select__trigger"], {
                        [styles["lang-select__trigger--open"]]: isOpen,
                    })}
                    onClick={this.langSelectService.toggleDropdown}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={ariaLabel}
                >
                    <span className={styles["lang-select__code"]}>{this.triggerLabel}</span>
                </button>
                <div
                    className={className(styles["lang-select__panel"], {
                        [styles["lang-select__panel--open"]]: isOpen,
                    })}
                    role="menu"
                    aria-hidden={!isOpen}
                >
                    <ul className={styles["lang-select__list"]}>
                        {langs.map(({ id, children }) => {
                            const isActive = id === this.locale.lang;
                            return (
                                <li key={id} className={styles["lang-select__item"]}>
                                    <button
                                        type="button"
                                        onClick={() => this.locale.setLocale(id)}
                                        className={className(styles["lang-select__option"], {
                                            [styles["lang-select__option--active"]]: isActive,
                                        })}
                                        role="menuitemradio"
                                        aria-checked={isActive}
                                    >
                                        <span className={styles["lang-select__option-name"]}>{children}</span>
                                        {isActive && (
                                            <svg
                                                className={styles["lang-select__option-icon"]}
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M3 8.5l3.5 3.5L13 4" />
                                            </svg>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        );
    }
}
