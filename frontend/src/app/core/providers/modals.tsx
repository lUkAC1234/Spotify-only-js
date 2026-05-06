import "./modals.scss";

import { Component, ReactNode } from "react";

import { inject } from "@/app/shared/decorators/di";
import { _static } from "@/app/shared/decorators/static";
import { Modal } from "@/app/shared/ui/modal/modal";

import { ModalService } from "../services/ui/modal.service";
import { ModalsService } from "../services/ui/modals.service";

@_static
export class Modals extends Component {
    modals: ModalsService = inject(ModalsService);
    services: {
        id: number;
        service: ModalService;
    }[] = [
        {
            id: 1,
            service: this.modals.modal,
        },
        {
            id: 2,
            service: this.modals.modalInner,
        },
        {
            id: 3,
            service: this.modals.modalStudents,
        },
    ];

    render(): ReactNode {
        return (
            <div className="modals">
                {this.services.map(({ id, service }) => (
                    <Modal key={id} service={service} />
                ))}
            </div>
        );
    }
}
