import { DisposableService } from "./core/services/disposable-stack.service";
import { inject, injectable } from "./shared/decorators/di";
import { setupInterceptors } from "./shared/utils/functions/interceptors";

@injectable()
export class AppService {
    disposable: DisposableService = inject(DisposableService);

    init(): void {
        setupInterceptors([]);
    }

    dispose(): void {
        this.disposable.dispose();
    }
}
