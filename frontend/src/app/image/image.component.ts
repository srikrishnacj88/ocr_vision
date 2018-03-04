import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {AppUtilService} from '../app-util.service';
import * as Rx from 'rxjs/Rx';

declare var $;

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.css']
})
export class ImageComponent implements OnInit {
  private DROPZONE_SELECTOR = '#dropzone';
  private IMG_SELECTOR = this.DROPZONE_SELECTOR + ' img';
  private DROP_CONTAINER_SELECTOR = this.DROPZONE_SELECTOR + ' .drop-container';
  private IMG_CONTAINER_SELECTOR = this.DROPZONE_SELECTOR + ' .img-container';
  private MSG_SELECTOR = this.DROPZONE_SELECTOR + ' .message h1';

  private UPLOAD_URL = 'http://localhost:8080/upload';

  @Output('image') private onImage = new EventEmitter();
  @Output('scale') private onScale = new EventEmitter();

  private scaleSize = 0.1;

  constructor() {
  }

  ngOnInit() {
    AppUtilService
      .fromDropGetImages(this.DROPZONE_SELECTOR)
      .switchMap(this.uploadFile.bind(this))
      .do(this.publishImage.bind(this))
      .switchMap(input => AppUtilService.fileToImg(input.file))
      .do(this.appendImageToDom.bind(this))
      .subscribe(img => {
        let zoom$ = AppUtilService
          .fromEventZoom(this.DROPZONE_SELECTOR)
          .do(this.rescaleImg.bind(this))
          .do(this.resizeImgContainer.bind(this));

        let $scroll = AppUtilService
          .fromEventScroll(this.DROP_CONTAINER_SELECTOR);

        Rx.Observable
          .combineLatest(zoom$, $scroll, (zoom, scroll) => Object.assign(scroll, {zoom}))
          .debounceTime(100)
          .map((event: any) => {
            event.container_size = {};
            event.container_size.width = $(this.IMG_CONTAINER_SELECTOR).width();
            event.container_size.height = $(this.IMG_CONTAINER_SELECTOR).height();
            return event;
          })
          .subscribe(this.publishScale.bind(this));
      });
  }

  publishImage(event) {
    this.onImage.emit(event);
  }

  publishScale(event) {
    this.onScale.emit(event);
  }

  appendImageToDom(img) {
    const $dropzone = $(this.IMG_CONTAINER_SELECTOR);
    $dropzone.empty();
    $dropzone.append(img);

    $(this.DROP_CONTAINER_SELECTOR).addClass('overflow-scroll');
  }

  rescaleImg(val) {
    $(this.IMG_SELECTOR).css('transform', 'scale(' + val + ')');
  }

  resizeImgContainer(val) {
    const $img = $(this.IMG_SELECTOR);
    const width = $img.width() * val;
    const height = $img.height() * val;

    $(this.IMG_CONTAINER_SELECTOR)
      .width(width)
      .height(height);
  }

  uploadFile(file) {
    $(this.MSG_SELECTOR).text('Uploading file');
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
      .catch(error => {
        $(this.MSG_SELECTOR).text('Upload failed. see console for more');
        console.log(error);
        return Rx.Observable.throw(error);
      })
      .pluck('response')
      .pluck('id')
      .map(id => Object.assign({}, {id, file}));
    return res$;
  }
}
