import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";

import styles from "./legal.module.scss";

interface Props {
    sectionKey: "legal" | "safety" | "privacy" | "cookies" | "ads" | "accessibility";
}

interface SectionContent {
    titleKey: string;
    bodyKeys: string[];
}

const SECTIONS: Record<Props["sectionKey"], SectionContent> = {
    legal: {
        titleKey: "sidebar.footer.legal",
        bodyKeys: ["legal.body.intro", "legal.body.terms", "legal.body.contact"],
    },
    safety: {
        titleKey: "sidebar.footer.safety",
        bodyKeys: ["legal.safety.intro", "legal.safety.report", "legal.safety.controls"],
    },
    privacy: {
        titleKey: "sidebar.footer.privacy",
        bodyKeys: ["legal.privacy.intro", "legal.privacy.data", "legal.privacy.rights"],
    },
    cookies: {
        titleKey: "sidebar.footer.cookies",
        bodyKeys: ["legal.cookies.intro", "legal.cookies.types", "legal.cookies.manage"],
    },
    ads: {
        titleKey: "sidebar.footer.ads",
        bodyKeys: ["legal.ads.intro", "legal.ads.choices"],
    },
    accessibility: {
        titleKey: "sidebar.footer.accessibility",
        bodyKeys: ["legal.accessibility.intro", "legal.accessibility.standards", "legal.accessibility.feedback"],
    },
};

@observer
export class LegalPage extends Component<Props> {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);

    componentDidMount(): void {
        const section = SECTIONS[this.props.sectionKey];
        this.title.construct({ title: "Spotify", titleNamespace: "common", titleTKey: section.titleKey as never });
        this.title.init();
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    render(): ReactNode {
        const section = SECTIONS[this.props.sectionKey];
        const title = this.locale.t("common", section.titleKey as never);
        const updated = new Date().toLocaleDateString(this.locale.lang, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        return (
            <article className={styles["legal"]}>
                <header className={styles["legal__hero"]}>
                    <span className={styles["legal__overline"]}>
                        {this.locale.t("common", "legal.overline")}
                    </span>
                    <h1 className={styles["legal__title"]}>{title}</h1>
                    <p className={styles["legal__updated"]}>
                        {this.locale.t("common", "legal.updated", { date: updated })}
                    </p>
                </header>

                <section className={styles["legal__content"]}>
                    {section.bodyKeys.map((key) => (
                        <p key={key} className={styles["legal__paragraph"]}>
                            {this.locale.t("common", key as never)}
                        </p>
                    ))}
                </section>
            </article>
        );
    }
}

export const Legal = (): ReactNode => <LegalPage sectionKey="legal" />;
export const Safety = (): ReactNode => <LegalPage sectionKey="safety" />;
export const Privacy = (): ReactNode => <LegalPage sectionKey="privacy" />;
export const Cookies = (): ReactNode => <LegalPage sectionKey="cookies" />;
export const Ads = (): ReactNode => <LegalPage sectionKey="ads" />;
export const Accessibility = (): ReactNode => <LegalPage sectionKey="accessibility" />;
