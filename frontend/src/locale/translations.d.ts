import alert from "@/locale/ru/alert.json";
import common from "@/locale/ru/common.json";
import errorBoundary from "@/locale/ru/error-boundary.json";
import error404 from "@/locale/ru/error404.json";
import fancybox from "@/locale/ru/fancybox.json";
import time from "@/locale/ru/time.json";

export interface LocaleLookup {
    "error-boundary": typeof errorBoundary;
    error404: typeof error404;
    alert: typeof alert;
    common: typeof common;
    fancybox: typeof fancybox;
    time: typeof time;
}
