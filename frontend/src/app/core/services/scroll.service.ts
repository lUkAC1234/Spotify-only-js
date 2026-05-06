import { injectable } from "@/app/shared/decorators/di";

@injectable()
export class ScrollService {
    scrollToTop(target?: HTMLElement | Window): void {
        (target ?? window).scrollTo({ left: 0, top: 0, behavior: "smooth" });
    }

    scrollIntoView(target: HTMLElement): void {
        target.scrollIntoView({
            behavior: "smooth",
        });
    }
}
