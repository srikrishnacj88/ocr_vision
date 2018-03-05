import {Injectable} from '@angular/core';
import * as Rx from '../../../node_modules/rxjs';
import {AppUtilService} from './app-util.service';

@Injectable()
export class UploadService {
  private UPLOAD_URL = AppUtilService.SERVER_BASE + 'upload/';

  constructor() {
  }

  upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    const request = new XMLHttpRequest();
    const getRequest = () => request;

    const options = {
      url: this.UPLOAD_URL,
      method: 'POST',
      body: formData,
      createXHR: getRequest
    };

    let res$ = Rx.Observable
      .ajax(options)
      .pluck('response')
      .pluck('id');
    return res$;
  }
}
