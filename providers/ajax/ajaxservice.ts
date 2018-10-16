import { Injectable } from '@angular/core';
import { AjaxOptions } from '../../providers/providers';
import { AppState } from '../app-state/app-state';
import * as $ from 'jquery';


@Injectable()
export class AjaxService {

    public appState: AppState;

    public request = (options: AjaxOptions, successCallback: Function, errorCallback?: Function) : void => {

        $.ajax({
            url: options.url,
            type: options.method,
            data: options.data,
            contentType: 'application/x-www-form-urlencoded',
            cache: false,
            username: this.appState.USERNAME.value,
            password: this.appState.PASSWORD.value,
            success: function (d, t, xhr) {
                successCallback(d, t, xhr);
            },
            error: function (d) {
                if (errorCallback) {
                    errorCallback(d);
                    return;
                }
                //var errorTitle = "Error in (" + options.url + ")";
                //var fullError = JSON.stringify(d);
            }
        });
    }

    public get = (url: string, successCallback: Function, errorCallback?: Function): void => {
        this.request(new AjaxOptions().setValues(url), successCallback, errorCallback);
    }
    public getWithDataInput = (url: string, data: any, successCallback: Function, errorCallback?: Function): void => {
        this.request(new AjaxOptions().setValues(url, "get", data), successCallback, errorCallback);
    }
    public post = (url: string, successCallback: Function, errorCallback?: Function): void => {
        this.request(new AjaxOptions().setValues(url, "post"), successCallback, errorCallback);
    }
    public postWithData = (url: string, data: any, successCallback: Function, errorCallback?: Function): void => {
        this.request(new AjaxOptions().setValues(url, "post", data), successCallback, errorCallback);
    }
    public putWithData = (url: string, data: any, successCallback: Function, errorCallback?: Function): void => {
        this.request(new AjaxOptions().setValues(url, "put", data), successCallback, errorCallback);
    }
}
