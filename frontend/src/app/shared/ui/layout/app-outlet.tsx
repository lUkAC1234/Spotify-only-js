import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react";
import { useLocation, useOutlet } from "react-router";

import { fadeInOutVariants, transitionWaitFast } from "@/app/core/constants/animation-variants";
import { LocaleService } from "@/app/core/services/locale.service";
import { LayoutService } from "@/app/core/services/ui/layout.service";

import { inject } from "../../decorators/di";
import { className } from "../../utils/functions/className";
import styles from "./app-outlet.module.scss";

const getStableKey = (pathname: string, langs: string[]) => {
    const parts = pathname.split("/").filter(Boolean);

    if (langs.includes(parts[0])) {
        parts.shift();
    }

    return "/" + (parts[0] || "");
};

type Props = {
    removeWrappers?: boolean;
    removePadding?: boolean;
};

export const AppOutlet = observer(({ removeWrappers, removePadding }: Props) => {
    const outlet = useOutlet();
    const location = useLocation();
    const layout: LayoutService = inject(LayoutService);
    const locale: LocaleService = inject(LocaleService);

    const key: string = getStableKey(location.pathname, locale.langs);

    const mainClassName: string = className(styles["main"], {
        [styles["main--mobile-header"]]: layout.breakpoints.isMobile,
        [styles["main--no-padding"]]: removePadding,
    });

    const wrapperClassName: string = className(styles["wrapper"], {
        [styles["wrapper--auth"]]: location.pathname.includes("login"),
        [styles["wrapper--mobile"]]: layout.breakpoints.isMobile || layout.sidebarIsMobileForce,
    });

    const jsx = (
        <AnimatePresence mode="wait">
            <motion.div
                key={key}
                ref={layout.mainRef as unknown as React.RefObject<HTMLDivElement>}
                className={mainClassName}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={fadeInOutVariants}
                transition={transitionWaitFast}
            >
                {outlet}
            </motion.div>
        </AnimatePresence>
    );

    return removeWrappers ? (
        jsx
    ) : (
        <div className={wrapperClassName}>
            <div className={styles["main-wrap"]} ref={layout.mainWrapRef}>
                {jsx}
            </div>
        </div>
    );
});
