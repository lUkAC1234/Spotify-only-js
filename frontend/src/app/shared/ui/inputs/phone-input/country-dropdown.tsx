import { observer } from "mobx-react";
import { Component, createRef, ReactNode, RefObject } from "react";

import { className } from "@/app/shared/utils/functions/className";

import { Country } from "./countries";
import styles from "./country-dropdown.module.scss";
import { PhoneInputService } from "./phone-input.service";

interface CountryDropdownProps {
    service: PhoneInputService;
    searchPlaceholder: string;
    onSelect?: (country: Country) => void;
}

@observer
export class CountryDropdown extends Component<CountryDropdownProps> {
    searchRef: RefObject<HTMLInputElement | null> = createRef();

    componentDidMount(): void {
        requestAnimationFrame(() => {
            this.searchRef.current?.focus();
        });
    }

    componentDidUpdate(_prevProps: CountryDropdownProps): void {
        if (this.props.service.isDropdownOpen && this.searchRef.current) {
            this.searchRef.current.focus();
        }
    }

    getItemClass(country: Country): string {
        return className(styles["item"], {
            [styles["item--active"]]: country.code === this.props.service.selectedCountry.code,
        });
    }

    render(): ReactNode {
        const { service, searchPlaceholder } = this.props;
        const filtered: Country[] = service.filteredCountries;

        const dropdownClass: string = className(styles["dropdown"], {
            [styles["dropdown--active"]]: service.isDropdownOpen,
        });

        return (
            <div className={dropdownClass}>
                <div className={styles["search-wrap"]}>
                    <input
                        ref={this.searchRef}
                        type="text"
                        className={styles["search-input"]}
                        placeholder={searchPlaceholder}
                        value={service.searchQuery}
                        onChange={(e) => service.setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                {filtered.length > 0 ? (
                    <ul className={styles["list"]}>
                        {filtered.map((country: Country) => (
                            <li key={country.code}>
                                <button
                                    type="button"
                                    className={this.getItemClass(country)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (this.props.onSelect) {
                                            this.props.onSelect(country);
                                        } else {
                                            service.selectCountry(country);
                                        }
                                    }}
                                >
                                    <span className={styles["item-flag"]}>{country.flag}</span>
                                    <span className={styles["item-name"]}>{country.name}</span>
                                    <span className={styles["item-dial"]}>{country.dialCode}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className={styles["empty"]}>—</div>
                )}
            </div>
        );
    }
}
