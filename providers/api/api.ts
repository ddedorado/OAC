import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

@Injectable()
export class Api {
  host: string;
  private STORAGE_KEY: string = 'settings';

  constructor(public http: HttpClient, private storage: Storage) {
    try
    {
      this.storage.get( this.STORAGE_KEY).then(values => {
        if (values != null) 
        {
          this.host = 'http://' + values.settings.user + ':' + values.settings.password + '@' + values.settings.host;  
        }
      });  
    }
    catch(e)
    {
      console.log("e");
    }
  }

  get(endpoint: string) {

    let headersReq : any = {
      headers: {
        'Access-Control-Allow-Origin' : '*', 
        'Access-Control-Allow-Methods' : 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
        'Access-Control-Allow-Headers' : 'Authorization,content-type' 
       },
       observe: 'response'
    }

    return this.http.get( this.host + '/' + endpoint, headersReq );
  }

  post(endpoint: string, body: any) {

    let headersReq : any = {
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded'
       },
       observe: 'response'
    };

    return this.http.post( this.host + '/' + endpoint, body, headersReq );
  }

  put(endpoint: string, body: any, reqOpts?: any) {
    return this.http.put(this.host + '/' + endpoint, body, reqOpts);
  }

  delete(endpoint: string, reqOpts?: any) {
    return this.http.delete(this.host + '/' + endpoint, reqOpts);
  }

  patch(endpoint: string, body: any, reqOpts?: any) {
    return this.http.patch(this.host + '/' + endpoint, body, reqOpts);
  }
}
