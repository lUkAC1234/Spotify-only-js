import { reaction } from "mobx";
import { observer } from "mobx-react";
import { Component, createRef, ReactNode, RefObject } from "react";

import { DisposableService } from "@/app/core/services/disposable-stack.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { Button } from "@/app/shared/ui/buttons/button";
import { SVG_ArrowDown } from "@/app/shared/ui/svg/svg-arrow-down";
import { SVG_Check } from "@/app/shared/ui/svg/svg-check";
import { className } from "@/app/shared/utils/functions/className";
import { langs } from "@/locale/_utils/langs.json";

import styles from "./lang-select.module.scss";
import { LangSelectService } from "./lang-select.service";

export type Props = {
    mini?: boolean;
};

@observer
export class LangSelect extends Component<Props> {
    selectWrapRef: RefObject<HTMLDivElement | null> = createRef();
    disposable: DisposableService = inject(DisposableService);
    langSelectService: LangSelectService = inject(LangSelectService);
    locale: LocaleService = inject(LocaleService);

    get langDropdownClass(): string {
        return className(styles["lang-dropdown"], {
            [styles["lang-dropdown--active"]]: this.langSelectService.isOpen,
        });
    }

    get langSelectBgClass(): string {
        return className(styles["lang-select-bg"], {
            [styles["lang-select-bg--active"]]: this.langSelectService.isOpen,
        });
    }

    get langSelectClass(): string {
        return className(styles["lang-select"], {
            [styles["lang-select--active"]]: this.langSelectService.isOpen,
        });
    }

    get selectedLang(): string {
        return this.props.mini ? this.langSelectService.selectedLang.slice(0, 3) : this.langSelectService.selectedLang;
    }

    getLangOptionClass(id: string): string {
        return id === this.locale.lang
            ? `${styles["lang-option"]} ${styles["lang-option--active"]}`
            : `${styles["lang-option"]}`;
    }

    outsideClickHandler = (evt: MouseEvent): void => {
        if (!this.selectWrapRef.current?.contains(evt.target as Node) && this.langSelectService.isOpen) {
            this.langSelectService.toggleDropdown();
        }
    };

    keydownHandler = (evt: KeyboardEvent): void => {
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
        return (
            <div className={styles["lang-select-wrap"]} ref={this.selectWrapRef}>
                <Button
                    className={this.langSelectClass}
                    onClick={this.langSelectService.toggleDropdown}
                    buttonType="secondary"
                    small
                >
                    {this.selectedLang}
                    <SVG_ArrowDown stroke="var(--text-color)" />
                </Button>
                <div className={this.langDropdownClass}>
                    <ul className={styles["lang-list"]}>
                        {langs.map(({ id, children }) => (
                            <li key={id}>
                                <button
                                    type="button"
                                    onClick={() => this.locale.setLocale(id)}
                                    className={this.getLangOptionClass(id)}
                                >
                                    {children}
                                    <SVG_Check />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
}
