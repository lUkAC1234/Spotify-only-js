import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService } from "@/app/core/services/locale.service";

import { inject } from "../../decorators/di";

const parseMessage = (rawMessage: string, localeService: LocaleService): string => {
    if (!rawMessage || !rawMessage.startsWith("{translate}")) {
        return rawMessage;
    }

    const extract = (key: string): string => {
        const regex = new RegExp(`${key}=({.*?}|[^}|]+)`);
        const match = rawMessage.match(regex);
        return match ? match[1] : null;
    };

    const namespace: string = extract("namespace");
    const path: string = extract("path");
    const varsRaw: string = extract("vars");

    let variables: Record<string, unknown> | undefined = undefined;

    if (varsRaw) {
        variables = {};
        const pairs = varsRaw.replace(/^\{|\}$/g, "").match(/([^, =]+)=([^,{}]+|{.*?})/g);
        pairs.forEach((pair) => {
            const [k, v] = pair.split("=");
            if (k && v) {
                (variables as any)[k.trim()] = v.trim();
            }
        });
    }

    if (namespace && path) {
        return localeService.t(namespace as any, path as any, variables);
    }

    return rawMessage;
};

@observer
export class AlertMessage extends Component<{ children: string }> {
    locale: LocaleService = inject(LocaleService);

    get parsedContent(): string {
        return parseMessage(this.props.children, this.locale);
    }

    render(): ReactNode {
        return this.parsedContent;
    }
}
