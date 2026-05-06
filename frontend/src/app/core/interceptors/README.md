# Interceptors

Interceptors are middlewares for network requests across the application for fetchData function that is available via named import or window.fetchData.
It sets rules before and after making requests.

Here is the example of auth interceptor:

```ts
import { inject } from "@/app/shared/decorators/di";
import { Middleware } from "@/app/shared/utils/functions/interceptors";

import { ApiService } from "../services/api.service";
import { AuthService } from "../services/auth.service";
import { ModalsService } from "../services/ui/modals.service";

async function request(input: URL | RequestInfo, init: RequestInit): Promise<void> {
    const api: ApiService = inject(ApiService);
    const urlString: string = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    if (urlString.includes(api.get("/login"))) {
        return;
    }

    const auth: AuthService = inject(AuthService);

    const headers = new Headers(init.headers);

    if (auth.authHeaders) {
        Object.entries(auth.authHeaders).forEach(([key, value]) => {
            headers.set(key, value as string);
        });
    }

    init.headers = headers;
}

async function response(response: Response): Promise<void> {
    const auth: AuthService = inject(AuthService);
    const modals: ModalsService = inject(ModalsService);

    if (response.status == 401) {
        auth.logout();
        if (modals.anyModalIsActive) {
            for (const modal of modals.modalsCollection.values()) {
                modal.toggleWindow(false);
                modal.setComponentClass(null);
            }
        }
    }
}

export const authInterceptor: Middleware = [request, response];
```
