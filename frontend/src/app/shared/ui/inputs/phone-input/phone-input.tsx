import { observer } from "mobx-react";
import { Component, createRef, ReactNode, RefObject } from "react";

import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { className } from "@/app/shared/utils/functions/className";

import { Country } from "./countries";
import { CountryDropdown } from "./country-dropdown";
import { extractDigits, getMaxDigits } from "./phone-format";
import styles from "./phone-input.module.scss";
import { PhoneInputService } from "./phone-input.service";

interface PhoneInputProps {
    onChange?: (fullPhone: string, isComplete: boolean) => void;
    fullwidth?: boolean;
    defaultValue?: string;
}

@observer
export class PhoneInput extends Component<PhoneInputProps> {
    locale: LocaleService = inject(LocaleService);
    service: PhoneInputService = inject(PhoneInputService);
    wrapRef: RefObject<HTMLDivElement | null> = createRef();
    inputRef: RefObject<HTMLInputElement | null> = createRef();
    private isFocused: boolean = false;

    componentDidMount(): void {
        document.addEventListener("mousedown", this.handleOutsideClick);
        document.addEventListener("keydown", this.handleKeyDown);
        if (this.props.defaultValue) {
            this.service.restoreFromFullPhone(this.props.defaultValue);
        }
    }

    componentWillUnmount(): void {
        document.removeEventListener("mousedown", this.handleOutsideClick);
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    handleOutsideClick = (e: MouseEvent): void => {
        if (!this.wrapRef.current?.contains(e.target as Node) && this.service.isDropdownOpen) {
            this.service.closeDropdown();
        }
    };

    handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape" && this.service.isDropdownOpen) {
            this.service.closeDropdown();
        }
    };

    private get expectedDigits(): number {
        return getMaxDigits(this.service.selectedCountry.format);
    }

    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const raw: string = extractDigits(e.target.value);
        this.service.setDigits(raw);
        this.props.onChange?.(this.service.fullPhone, this.service.digits.length === this.expectedDigits);
    };

    handleCountrySelect = (country: Country): void => {
        this.service.selectCountry(country);
        this.props.onChange?.(this.service.fullPhone, false);
    };

    handleSelectorClick = (): void => {
        this.service.toggleDropdown();
    };

    handleFocus = (): void => {
        this.isFocused = true;
        this.forceUpdate();
    };

    handleBlur = (): void => {
        this.isFocused = false;
        this.forceUpdate();
    };

    render(): ReactNode {
        const { fullwidth } = this.props;

        const wrapClass: string = className(styles["wrap"], {
            [styles["wrap--fullwidth"]]: fullwidth,
            [styles["wrap--focused"]]: this.isFocused,
        });

        const arrowClass: string = className(styles["arrow"], {
            [styles["arrow--open"]]: this.service.isDropdownOpen,
        });

        return (
            <div className={wrapClass} ref={this.wrapRef}>
                <button
                    type="button"
                    className={styles["selector"]}
                    onClick={this.handleSelectorClick}
                >
                    <span className={styles["flag"]}>{this.service.selectedCountry.flag}</span>
                    <span className={styles["dial-code"]}>{this.service.selectedCountry.dialCode}</span>
                    <svg className={arrowClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
                <input
                    ref={this.inputRef}
                    type="tel"
                    className={styles["field"]}
                    value={this.service.formattedPhone}
                    placeholder={this.service.placeholder}
                    onChange={this.handleInputChange}
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                />
                <CountryDropdown
                    service={this.service}
                    searchPlaceholder={this.locale.t("common", "country-search")}
                    onSelect={this.handleCountrySelect}
                />
            </div>
        );
    }
}
