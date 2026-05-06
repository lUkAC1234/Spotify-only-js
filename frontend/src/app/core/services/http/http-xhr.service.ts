import { action, makeObservable, observable } from "mobx";

import { injectable } from "@/app/shared/decorators/di";

@injectable({
    provideIn: "local",
})
export class XMLHttp {
    @observable currentXhr: XMLHttpRequest | null = null;
    @observable downloadProgress: number = 0;
    @observable uploadProgress: number = 0;
    @observable isLoading: boolean = false;
    @observable state: number = XMLHttpRequest.UNSENT;
    @observable status: number = 0;
    @observable statusText: string = "";
    @observable response: any = null;

    constructor() {
        makeObservable(this);
    }

    @action.bound
    request(url: string, method: string = "GET", data: any = null): void {
        if (this.currentXhr) {
            this.currentXhr.abort();
        }

        this.isLoading = true;
        this.downloadProgress = 0;
        this.uploadProgress = 0;
        this.response = null;
        this.status = 0;

        const xhr = new XMLHttpRequest();
        this.currentXhr = xhr;

        xhr.open(method, url, true);

        if (data && typeof data === "object" && !(data instanceof FormData)) {
            xhr.setRequestHeader("Content-Type", "application/json");
            data = JSON.stringify(data);
        }

        xhr.onreadystatechange = action(() => {
            this.state = xhr.readyState;
        });

        xhr.onprogress = action((evt) => {
            if (evt.lengthComputable) {
                this.downloadProgress = Math.round((evt.loaded / evt.total) * 100);
            }
        });

        xhr.upload.onprogress = action((evt) => {
            if (evt.lengthComputable) {
                this.uploadProgress = Math.round((evt.loaded / evt.total) * 100);
            }
        });

        xhr.onload = action(() => {
            this.status = xhr.status;
            this.statusText = xhr.statusText;
            this.isLoading = false;

            const contentType = xhr.getResponseHeader("Content-Type");
            if (contentType && contentType.includes("application/json")) {
                try {
                    this.response = JSON.parse(xhr.responseText);
                } catch (e) {
                    this.response = xhr.responseText;
                }
            } else {
                this.response = xhr.response;
            }

            this.currentXhr = null;
        });

        xhr.onerror = action(() => {
            this.state = xhr.readyState;
            this.isLoading = false;
            this.currentXhr = null;
        });

        xhr.send(data);
    }

    @action.bound
    cancel(): void {
        if (this.currentXhr) {
            this.currentXhr.abort();
            this.currentXhr = null;
            this.isLoading = false;
        }
    }
}
