import { Injectable } from '@angular/core';

@Injectable()
export class AjaxOptions {
    url: string;
    method: string;
    data: any;

    setValues(curl: string, cmethod?: string, cdata?: any) {
        this.url = curl;
        this.method = cmethod || "get";
        this.data = cdata;

        return this;
    }
}
