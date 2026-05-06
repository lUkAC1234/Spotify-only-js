import { lazyLoaded } from "../../hocs/lazy-loaded";
import { Lazy } from "../../utils/functions/lazy";

export const Layouts = {
    Landing: lazyLoaded(Lazy.Named(() => import("./landing-layout"), "LandingLayout")),
    Error: lazyLoaded(Lazy.Named(() => import("./error-layout"), "ErrorLayout")),
    Shell: lazyLoaded(Lazy.Named(() => import("./shell-layout/shell-layout"), "ShellLayout")),
    Auth: lazyLoaded(Lazy.Named(() => import("./auth-layout/auth-layout"), "AuthLayout")),
};
