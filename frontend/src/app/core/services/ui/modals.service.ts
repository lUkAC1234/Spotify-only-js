import { computed, makeObservable } from "mobx";

import { inject, injectable } from "@/app/shared/decorators/di";

import { ModalService } from "./modal.service";

@injectable()
export class ModalsService {
    modal: ModalService = inject(ModalService);
    modalInner: ModalService = inject(ModalService);
    modalStudents: ModalService = inject(ModalService);

    modalsCollection: Set<ModalService> = new Set();

    @computed
    get anyModalIsActive(): boolean {
        return this.modal.isActive || this.modalInner.isActive || this.modalStudents.isActive;
    }

    constructor() {
        this.modalsCollection.add(this.modal);
        this.modalsCollection.add(this.modalInner);
        this.modalsCollection.add(this.modalStudents);

        this.modalStudents.construct({
            disableEscape: true,
            noTransition: true,
        });

        makeObservable(this);
    }
}
