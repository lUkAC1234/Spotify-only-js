import { Transition } from "framer-motion";

export const fadeInOutVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const scaleInOutVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
};

export const staggerContainerVariants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.06,
            delayChildren: 0.04,
        },
    },
    exit: {
        transition: {
            staggerChildren: 0.04,
            staggerDirection: -1,
        },
    },
};

export const staggerItemVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
};

export const transitionWait: Transition<any> = {
    type: "spring",
    stiffness: 300,
    damping: 30,
};

export const transitionWaitFast: Transition<any> = {
    type: "spring",
    stiffness: 500,
    damping: 40,
};

export const transitionSync: Transition<any> = {
    type: "spring",
    stiffness: 300,
    damping: 25,
};

const curveConfident: [number, number, number, number] = [0.22, 1, 0.36, 1];

const curveDeliberate: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const transitionReveal: Transition<any> = {
    duration: 0.7,
    ease: curveConfident,
};

export const transitionRevealSlow: Transition<any> = {
    duration: 0.9,
    ease: curveDeliberate,
};

export const transitionRevealFast: Transition<any> = {
    duration: 0.45,
    ease: curveConfident,
};

export const transitionOverlay: Transition<any> = {
    duration: 0.3,
    ease: curveConfident,
};

export const transitionModal: Transition<any> = {
    type: "spring",
    stiffness: 400,
    damping: 28,
};


export const heroRevealVariants = {
    initial: { opacity: 0, y: 30, scale: 0.97, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
};

export const heroStatsContainerVariants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.5,
        },
    },
};

export const heroStatStampVariants = {
    initial: { opacity: 0, scale: 1.15, y: -8 },
    animate: { opacity: 1, scale: 1, y: 0 },
};

export const teamGridContainerVariants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15,
        },
    },
};

export const teamCardVariants = {
    initial: { opacity: 0, scale: 0.92, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
};

export const aboutPhotoVariants = {
    initial: { opacity: 0, x: -60, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
};

export const aboutTextVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0 },
};

export const footerContainerVariants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.05,
        },
    },
};

export const footerBlockVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
};

export const sectionTitleVariants = {
    initial: { opacity: 0, clipPath: "inset(0 100% 0 0)" },
    animate: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
};

export const panelContentVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

export const modalOverlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const modalScaleVariants = {
    initial: { scale: 0.85, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.9, opacity: 0, y: 10 },
};

