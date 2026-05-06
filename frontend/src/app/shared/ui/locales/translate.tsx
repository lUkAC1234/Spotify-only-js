import { observer } from "mobx-react";
import { Component, ReactNode } from "react";

import { LocaleService, Paths } from "@/app/core/services/locale.service";
import { inject } from "@/app/shared/decorators/di";
import { LocaleLookup } from "@/locale/translations";

export type TranslateProps<K extends keyof LocaleLookup> = {
    namespace: K;
    path: Paths<LocaleLookup[K]>;
    vars?: Record<string, unknown>;
    custom?: (translation: string) => ReactNode;
};

@observer
export class Translate<K extends keyof LocaleLookup> extends Component<TranslateProps<K>> {
    private readonly locale: LocaleService = inject(LocaleService);

    render(): ReactNode {
        const translation = this.locale.t(this.props.namespace, this.props.path, this.props.vars);
        return this.props.custom ? this.props.custom(translation) : translation;
    }
}
