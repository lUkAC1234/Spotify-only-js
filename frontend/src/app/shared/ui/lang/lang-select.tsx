import { observer } from "mobx-react";
import { Component, ReactNode, RefObject, createRef } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";
import { Menu } from "@/app/shared/ui/popover/menu";
import { MenuItem } from "@/app/shared/ui/popover/menu-item";
import { Popover } from "@/app/shared/ui/popover/popover";
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
    private triggerRef: RefObject<HTMLButtonElement | null> = createRef();
    private langSelectService: LangSelectService = inject(LangSelectService);
    private locale: LocaleService = inject(LocaleService);

    private get triggerLabel(): string {
        return LANG_CODES[this.locale.lang] ?? this.locale.lang.toUpperCase().slice(0, 2);
    }

    private toggle = (): void => {
        this.langSelectService.toggleDropdown();
    };

    private close = (): void => {
        if (this.langSelectService.isOpen) this.langSelectService.toggleDropdown();
    };

    private handleSelect = (id: string): void => {
        this.locale.setLocale(id);
    };

    render(): ReactNode {
        const isOpen = this.langSelectService.isOpen;
        const ariaLabel = this.locale.t("common", "lang.aria-label");
        const currentLang = this.locale.lang;

        return (
            <>
                <button
                    type="button"
                    ref={this.triggerRef}
                    className={className(styles["lang-select__trigger"], {
                        [styles["lang-select__trigger--open"]]: isOpen,
                    })}
                    onClick={this.toggle}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={ariaLabel}
                >
                    <span className={styles["lang-select__code"]}>{this.triggerLabel}</span>
                </button>
                <Popover
                    isOpen={isOpen}
                    anchorRef={this.triggerRef}
                    placement="top-end"
                    onClose={this.close}
                    label={ariaLabel}
                >
                    <Menu label={ariaLabel} onClose={this.close}>
                        {langs.map(({ id, children }) => {
                            const isActive = id === currentLang;
                            return (
                                <MenuItem
                                    key={id}
                                    label={children}
                                    selected={isActive}
                                    trailingIcon={
                                        isActive ? (
                                            <svg
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
                                        ) : undefined
                                    }
                                    onSelect={() => this.handleSelect(id)}
                                />
                            );
                        })}
                    </Menu>
                </Popover>
            </>
        );
    }
}
