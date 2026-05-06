import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { AuthService } from "@/app/core/services/auth/auth.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";

import styles from "./greeting.module.scss";

const partOfDayKey = (date: Date): "morning" | "afternoon" | "evening" => {
    const hour = date.getHours();
    if (hour < 5 || hour >= 22) return "evening";
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
};

@observer
export class Greeting extends Component {
    private locale: LocaleService = inject(LocaleService);
    private auth: AuthService = inject(AuthService);

    render(): ReactNode {
        const part = partOfDayKey(new Date());
        const phraseKey = `home.greeting.${part}` as const;
        const name: string | null = this.auth.me?.displayName ?? null;
        const phrase: string = this.locale.t(
            "common",
            phraseKey,
            name ? { name } : undefined,
        );
        const cleanedPhrase: string = name ? phrase : phrase.replace(/,?\s*\{name\}/i, "").trim();

        return (
            <header className={styles["greeting"]}>
                <h1 className={styles["greeting__title"]}>{cleanedPhrase}</h1>
            </header>
        );
    }
}
