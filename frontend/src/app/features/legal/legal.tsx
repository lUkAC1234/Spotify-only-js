import { observer } from "mobx-react";
import { Component, ComponentType, ReactNode } from "react";

import { TitleService } from "@/app/core/services/browser/title.service";
import { LocaleService } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { SVG_AccessibilityIllustration } from "@/app/shared/ui/svg/illustrations/svg-accessibility-illustration";
import { SVG_AdsIllustration } from "@/app/shared/ui/svg/illustrations/svg-ads-illustration";
import { SVG_CookiesIllustration } from "@/app/shared/ui/svg/illustrations/svg-cookies-illustration";
import { SVG_LegalIllustration } from "@/app/shared/ui/svg/illustrations/svg-legal-illustration";
import { SVG_PrivacyIllustration } from "@/app/shared/ui/svg/illustrations/svg-privacy-illustration";
import { SVG_SafetyIllustration } from "@/app/shared/ui/svg/illustrations/svg-safety-illustration";

import styles from "./legal.module.scss";

type SectionKey = "legal" | "safety" | "privacy" | "cookies" | "ads" | "accessibility";

interface Props {
    sectionKey: SectionKey;
}

interface SectionContent {
    titleKey: string;
    bodyKeys: string[];
    Illustration: ComponentType<{ className?: string }>;
}

const SECTIONS: Record<SectionKey, SectionContent> = {
    legal: {
        titleKey: "sidebar.footer.legal",
        bodyKeys: ["legal.body.intro", "legal.body.terms", "legal.body.contact"],
        Illustration: SVG_LegalIllustration,
    },
    safety: {
        titleKey: "sidebar.footer.safety",
        bodyKeys: ["legal.safety.intro", "legal.safety.report", "legal.safety.controls"],
        Illustration: SVG_SafetyIllustration,
    },
    privacy: {
        titleKey: "sidebar.footer.privacy",
        bodyKeys: ["legal.privacy.intro", "legal.privacy.data", "legal.privacy.rights"],
        Illustration: SVG_PrivacyIllustration,
    },
    cookies: {
        titleKey: "sidebar.footer.cookies",
        bodyKeys: ["legal.cookies.intro", "legal.cookies.types", "legal.cookies.manage"],
        Illustration: SVG_CookiesIllustration,
    },
    ads: {
        titleKey: "sidebar.footer.ads",
        bodyKeys: ["legal.ads.intro", "legal.ads.choices"],
        Illustration: SVG_AdsIllustration,
    },
    accessibility: {
        titleKey: "sidebar.footer.accessibility",
        bodyKeys: ["legal.accessibility.intro", "legal.accessibility.standards", "legal.accessibility.feedback"],
        Illustration: SVG_AccessibilityIllustration,
    },
};

@observer
export class LegalPage extends Component<Props> {
    private title: TitleService = inject(TitleService);
    private locale: LocaleService = inject(LocaleService);

    componentDidMount(): void {
        const section = SECTIONS[this.props.sectionKey];
        this.title.construct({ title: "Spenzora", titleNamespace: "common", titleTKey: section.titleKey as never });
        this.title.init();
    }

    componentWillUnmount(): void {
        this.title.dispose();
    }

    render(): ReactNode {
        const section = SECTIONS[this.props.sectionKey];
        const { Illustration } = section;
        const title = this.locale.t("common", section.titleKey as never);
        const updated = new Date().toLocaleDateString(this.locale.lang, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        return (
            <article className={styles["legal"]}>
                <header className={styles["legal__hero"]}>
                    <span className={styles["legal__icon"]} aria-hidden="true">
                        <Illustration className={styles["legal__icon-svg"]} />
                    </span>
                    <div className={styles["legal__hero-text"]}>
                        <h1 className={styles["legal__title"]}>{title}</h1>
                        <p className={styles["legal__updated"]}>
                            {this.locale.t("common", "legal.updated", { date: updated })}
                        </p>
                    </div>
                </header>

                <section className={styles["legal__content"]} aria-label={title}>
                    {section.bodyKeys.map((key, index) => (
                        <div key={key} className={styles["legal__block"]}>
                            <span className={styles["legal__block-index"]} aria-hidden="true">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <p className={styles["legal__paragraph"]}>
                                {this.locale.t("common", key as never)}
                            </p>
                        </div>
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
