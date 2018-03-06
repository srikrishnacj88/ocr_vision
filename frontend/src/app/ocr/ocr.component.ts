import {Component, ElementRef, Input, OnInit, Output, ViewChild} from '@angular/core';
import * as Rx from 'rxjs/Rx';
import {LoggerService} from '../services/logger.service';
import {AppUtilService} from '../services/app-util.service';
import {UploadService} from '../services/upload.service';
import {KonvaCanvasService} from '../services/canvas/konva-canvas.service';

declare var $;

@Component({
  selector: 'app-ocr',
  templateUrl: './ocr.component.html',
  styleUrls: ['./ocr.component.css']
})
export class OcrComponent {
  private logger: any;

  @ViewChild('zone') VIEW: ElementRef;
  @Input('input') inputs: any;

  private subscriptions: Array<any> = [];

  private MSG_SELECTOR: string;
  private ZONE_SELECTOR: string;
  private CANVAS_SELECTOR: string;

  private canvas: any;

  constructor(private uploadService: UploadService) {

  }

  ngAfterViewInit() {
    this.logger = LoggerService.getLogger(this.inputs.id);
    this.MSG_SELECTOR = '#' + this.inputs.id + ' .message';
    this.ZONE_SELECTOR = '#' + this.inputs.id + ' .zone';
    this.CANVAS_SELECTOR = '#' + this.inputs.id + ' .konvajs-content';
    this.message('Drop your images here');

    let subscription$ = null;

    /**
     * Process Image Events
     **/
    subscription$ = AppUtilService
      .fromDropGetImages('#' + this.inputs.id)
      .switchMap(this.upload.bind(this))
      .catch(error => {
        if (error.response && error.response.message.indexOf('exceeds the configured maximum') !== -1) {
          this.message('Image size must be less then 4MB');
        } else {
          this.message('Failed to upload you image.');
          this.logger.error(error);
        }
        return Rx.Observable.empty();
      })
      .map(this.publishImgEvent.bind(this))
      .do(this.processImgEvent.bind(this))
      .subscribe();
    this.subscriptions.push(subscription$);

    subscription$ = this.inputs.imageIN$
      .do(this.processImgEvent.bind(this))
      .subscribe();
    this.subscriptions.push(subscription$);


    /**
     * Process Scroll Events
     **/
    let selfScroll$ = AppUtilService
      .fromEventScroll(this.ZONE_SELECTOR)
      .debounceTime(50)
      .map(this.publishScrollEvent.bind(this));

    subscription$ = Rx.Observable
      .merge(selfScroll$, this.inputs.scrollIN$)
      .distinctUntilChanged((prev: any, next: any) => {
        let isTopSame = prev.scroll.scrollTop === next.scroll.scrollTop;
        let isLeftSame = prev.scroll.scrollLeft === next.scroll.scrollLeft;
        return isTopSame && isLeftSame;
      })
      .do(this.processScrollEvent.bind(this))
      .subscribe();
    this.subscriptions.push(subscription$);


    /**
     * Process Zoom Events
     **/
    subscription$ = AppUtilService
      .fromEventZoom(this.ZONE_SELECTOR)
      .debounceTime(50)
      .map(this.publishZoomEvent.bind(this))
      .do(this.processZoomEvent.bind(this))
      .subscribe();
    this.subscriptions.push(subscription$);

    this.inputs.zoomIN$
      .do(this.processZoomEvent.bind(this))
      .subscribe();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub$ => {
      sub$.unsubscribe();
    });
  }

  message(msg) {
    $(this.MSG_SELECTOR).text(this.inputs.name + ': ' + msg);
  }

  upload(file) {
    this.message('Uploading your image');
    const res$ = this.uploadService.upload(file)
      .do((id: any) => $(this.MSG_SELECTOR).text('File ID: ' + (id.substr(0, 7)) + '...'))
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

  publishImgEvent(id) {
    let event: any = {id: this.inputs.id};
    event.img = {id};

    this.inputs.imageOT$.next(event);
    return event;
  }

  processImgEvent(event) {
    this.logger.info('Image event received');
    let ID = this.inputs.id + '_KONVA_CONTAINER';
    $(this.VIEW.nativeElement).find('.pluginarea').attr('id', ID);

    let URL = 'http://localhost:8080/image/' + event.img.id;

    this.message('creating canvas');
    KonvaCanvasService.create(ID, URL)
      .do(() => this.message('making service call'))
      .switchMap(canvas => {
        if (!this.inputs.ocr) {
          return Rx.Observable.of({canvas, words: []});
        }
        let res$ = this.inputs.ocr
          .process(event.img.id)
          .map(words => Object.assign({}, {words, canvas}))
          .catch(error => {
            this.message('Service call failed');
            return Rx.Observable.empty();
          });
        return res$;
      })
      .do(() => this.message('preparing canvas'))
      .do(data => KonvaCanvasService.setWords(data.canvas, data.words))
      .do(data => this.canvas = data.canvas)
      .do(this.showCanvasDIV.bind(this))
      .subscribe();
  }

  showCanvasDIV() {
    $(this.VIEW.nativeElement).find('.pluginarea').removeClass('hide');
    $(this.VIEW.nativeElement).find('.message-container').addClass('hide');
    $(this.VIEW.nativeElement).addClass('overflow-scroll');
  }

  publishScrollEvent(scroll) {
    let event = {id: this.inputs.id, scroll};
    // this.logger.debug('publishing SCROLL Event: ' + JSON.stringify(event));
    this.inputs.scrollOT$.next(event);
    return event;
  }

  processScrollEvent(event) {
    // this.logger.debug('SCROLL Event received: ' + JSON.stringify(event));
    let scroll = event.scroll;
    $(this.ZONE_SELECTOR)
      .scrollTop(scroll.scrollTop)
      .scrollLeft(scroll.scrollLeft);
  }

  publishZoomEvent(zoom) {
    let event = {id: this.inputs.id, zoom};
    // this.logger.debug('publishing ZOOM Event: ' + JSON.stringify(event));
    this.inputs.zoomOT$.next(event);
    return event;
  }

  processZoomEvent(event) {
    this.logger.debug('ZOOM Event received: ' + JSON.stringify(event));

    if (!this.canvas) {
      return;
    }
    // if (event.zoom > 1) {
    //   this.logger.info('cannon zoom more then 100%');
    //   return;
    // }

    KonvaCanvasService.zoom(this.canvas, event.zoom);

    let width = KonvaCanvasService.getWidth(this.canvas);
    let height = KonvaCanvasService.getHeight(this.canvas);
    width = KonvaCanvasService.scaleFor(event.zoom, width);
    height = KonvaCanvasService.scaleFor(event.zoom, height);

    $(this.CANVAS_SELECTOR)
      .width(width)
      .height(height);
  }
}
