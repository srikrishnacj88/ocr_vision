import {Component, ElementRef, Input, OnInit, Output, ViewChild} from '@angular/core';
import * as Rx from 'rxjs/Rx';
import {LoggerService} from '../logger.service';
import {AppUtilService} from '../app-util.service';
import {OCRService, Word} from '../services/OCRService';

declare var $;

@Component({
  selector: 'app-ocr',
  templateUrl: './ocr.component.html',
  styleUrls: ['./ocr.component.css']
})
export class OcrComponent {

  private logger: any;

  @ViewChild('zone') VIEW: ElementRef;
  @Input('input') input: any;

  toChild = {
    imageToCanvas$: new Rx.Subject(),
    canvasScale$: new Rx.Subject(),
    words$: new Rx.Subject()
  };

  private UPLOAD_URL = 'http://localhost:8080/upload';

  private ZONE_CONTAINER_SELECTOR: string;
  private MSG_SELECTOR: string;
  private MSG_CONTAINER_SELECTOR: string;
  private CANVAS_SELECTOR: string;

  ngAfterViewInit() {
    this.logger = LoggerService.getLogger(this.input.id);
    this.MSG_SELECTOR = '#' + this.input.id + ' .message';
    this.MSG_CONTAINER_SELECTOR = '#' + this.input.id + ' .message-container';
    this.ZONE_CONTAINER_SELECTOR = '#' + this.input.id + ' .zone-container';
    this.CANVAS_SELECTOR = '#' + this.input.id + ' app-ocr-canvas';

    this.message('Drop your images here');

    AppUtilService
      .fromDropGetImages('#' + this.input.id)
      .observeOn(Rx.Scheduler.async)
      .switchMap(this.uploadFile.bind(this))
      .observeOn(Rx.Scheduler.async)
      .switchMap(event => AppUtilService.fileToImgObj.call(AppUtilService, event.id).map(img => Object.assign(event, {img})))
      .observeOn(Rx.Scheduler.async)
      .map(this.publishImageEvent.bind(this))
      .observeOn(Rx.Scheduler.async)
      .do(this.processImageEvent.bind(this))
      .subscribe();

    this.input.imageIN$
      .do(this.processImageEvent.bind(this))
      .subscribe();

    AppUtilService
      .fromEventScroll(this.ZONE_CONTAINER_SELECTOR)
      .debounceTime(50)
      // .do(this.processScrollEvent.bind(this))
      .do(this.publishScrollEvent.bind(this))
      .subscribe();

    this.input.scrollIN$
      .do(this.processScrollEvent.bind(this))
      .subscribe();

    AppUtilService
      .fromEventZoom('#' + this.input.id)
      .debounceTime(50)
      .observeOn(Rx.Scheduler.async)
      .map(this.publishZoomEvent.bind(this))
      .observeOn(Rx.Scheduler.async)
      .do(this.processZoomEvent.bind(this))
      .subscribe();


    this.input.zoomIN$
      .do(this.processZoomEvent.bind(this))
      .subscribe();
  }

  processImageEvent(event) {
    let service: OCRService = this.input.ocr;
    if (service) {
      this.message('Calling service. Hang on');
      service
        .process(event.fileMap.id)
        .catch(() => {
          this.message('Service request failed');
          return Rx.Observable.empty();
        })
        .do(() => this.showCanvasDOM())
        .do(() => this.toChild.imageToCanvas$.next(event))
        .subscribe((words: Array<Word>) => {
          this.toChild.words$.next(words);
        });
    } else {
      this.toChild.imageToCanvas$.next(event);
      this.showCanvasDOM();
    }
  }

  publishImageEvent(fileMap) {
    let event = {id: this.input.id, fileMap};
    this.logger.debug('publishing ZOOM Event: ' + JSON.stringify(event));
    this.input.imageOT$.next(event);
    return event;
  }

  processZoomEvent(event) {
    this.logger.debug('ZOOM Event received: ' + JSON.stringify(event));
    const $konva = $(this.CANVAS_SELECTOR).find('.konvajs-content');
    const width = $konva.width() * event.zoom;
    const height = $konva.height() * event.zoom;

    $(this.CANVAS_SELECTOR)
      .width(width)
      .height(height);

    this.toChild.canvasScale$.next(event.zoom);
    // $(this.CANVAS_SELECTOR).find('.konvajs-content').css('transform', 'scale(' + event.zoom + ')');
  }

  publishZoomEvent(zoom) {
    let event = {id: this.input.id, zoom};
    this.logger.debug('publishing ZOOM Event: ' + JSON.stringify(event));
    this.input.zoomOT$.next(event);
    return event;
  }

  processScrollEvent(event) {
    this.logger.debug('SCROLL Event received: ' + JSON.stringify(event));
    let scroll = event.scroll;
    $(this.ZONE_CONTAINER_SELECTOR)
      .scrollTop(scroll.scrollTop)
      .scrollLeft(scroll.scrollLeft);
  }

  publishScrollEvent(scroll) {
    let event = {id: this.input.id, scroll};
    this.logger.debug('publishing SCROLL Event: ' + JSON.stringify(event));
    this.input.scrollOT$.next(event);
  }

  uploadFile(file) {
    this.message('Uploading your image');
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
      .pluck('id')
      .map(id => Object.assign({}, {id, file}))
      .do((data: any) => $(this.MSG_SELECTOR).text('File ID: ' + (data.id.substr(0, 7)) + '...'))
      .catch(error => {
        if (error.response && error.response.message.indexOf('exceeds the configured maximum') !== -1) {
          this.message('Image size must be less then 4MB');
        } else {
          this.message('Failed to upload you image.');
          this.logger.error(error);
        }
        return Rx.Observable.empty();
      });
    return res$;
  }

  showCanvasDOM() {
    $(this.MSG_CONTAINER_SELECTOR).remove();
    $(this.CANVAS_SELECTOR).removeClass('hide');
    $(this.ZONE_CONTAINER_SELECTOR).addClass('overflow-scroll');
  }

  message(msg) {
    $(this.MSG_SELECTOR).text(this.input.name + ': ' + msg);
  }
}
