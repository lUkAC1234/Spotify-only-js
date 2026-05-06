import { action, computed, makeObservable, observable } from "mobx";

import { injectable } from "@/app/shared/decorators/di";

import { COUNTRIES, Country, DEFAULT_COUNTRY } from "./countries";
import { extractDigits, formatPhone, getMaxDigits, getPlaceholder } from "./phone-format";

@injectable({
    provideIn: "local",
})
export class PhoneInputService {
    @observable selectedCountry: Country = DEFAULT_COUNTRY;
    @observable digits: string = "";
    @observable isDropdownOpen: boolean = false;
    @observable searchQuery: string = "";

    constructor() {
        makeObservable(this);
    }

    @computed
    get formattedPhone(): string {
        return formatPhone(this.digits, this.selectedCountry.format);
    }

    @computed
    get fullPhone(): string {
        return this.selectedCountry.dialCode + this.digits;
    }

    @computed
    get placeholder(): string {
        return getPlaceholder(this.selectedCountry.format);
    }

    @computed
    get filteredCountries(): Country[] {
        const query: string = this.searchQuery.trim().toLowerCase();
        if (!query) return COUNTRIES;

        return COUNTRIES.filter((c: Country) =>
            c.name.toLowerCase().includes(query) ||
            c.nameRu.toLowerCase().includes(query) ||
            c.dialCode.includes(query) ||
            c.code.toLowerCase().includes(query),
        );
    }

    @action.bound
    setDigits(raw: string): void {
        const digits: string = extractDigits(raw);
        const max: number = getMaxDigits(this.selectedCountry.format);
        this.digits = digits.slice(0, max);
    }

    @action.bound
    selectCountry(country: Country): void {
        this.selectedCountry = country;
        this.digits = "";
        this.isDropdownOpen = false;
        this.searchQuery = "";
    }

    @action.bound
    toggleDropdown(): void {
        this.isDropdownOpen = !this.isDropdownOpen;
        if (!this.isDropdownOpen) this.searchQuery = "";
    }

    @action.bound
    closeDropdown(): void {
        this.isDropdownOpen = false;
        this.searchQuery = "";
    }

    @action.bound
    setSearchQuery(value: string): void {
        this.searchQuery = value;
    }

    @action.bound
    restoreFromFullPhone(fullPhone: string): void {
        if (!fullPhone) return;
        const sorted: Country[] = [...COUNTRIES].sort((a: Country, b: Country) => b.dialCode.length - a.dialCode.length);
        for (const country of sorted) {
            if (fullPhone.startsWith(country.dialCode)) {
                this.selectedCountry = country;
                this.digits = extractDigits(fullPhone.slice(country.dialCode.length));
                return;
            }
        }
    }

    @action.bound
    reset(): void {
        this.selectedCountry = DEFAULT_COUNTRY;
        this.digits = "";
        this.isDropdownOpen = false;
        this.searchQuery = "";
    }
}
