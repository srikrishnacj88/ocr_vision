import {Component, Input, OnInit} from '@angular/core';
import * as Rx from 'rxjs/Rx';
import {LoggerService} from '../logger.service';

declare var $;

@Component({
  selector: 'app-google',
  templateUrl: './google.component.html',
  styleUrls: ['./google.component.css']
})
export class GoogleComponent implements OnInit {
  private logger: any;

  @Input('image$') image$: Rx.Observable<any>;
  @Input('scale$') scale$: Rx.Observable<any>;
  public words$ = new Rx.Subject();

  private ZONE_SELECTOR = '#googlezone';
  private ZONE_CONTAINER_SELECTOR = this.ZONE_SELECTOR + ' .zone-container';
  private CANVAS_SELECTOR = this.ZONE_SELECTOR + ' app-ocr-canvas';
  private MSG_CONTAINER_SELECTOR = this.ZONE_SELECTOR + ' .message';
  private MSG_SELECTOR = this.ZONE_SELECTOR + ' .message h1';

  constructor() {
    this.logger = LoggerService.getLogger('GoogleComponent');
  }

  ngOnInit() {
    this.image$
      .observeOn(Rx.Scheduler.async)
      .switchMap(this.processOCR.bind(this))
      .do(this.prepareCanvas.bind(this))
      // Image will be published to child due to shared input
      .subscribe(this.publishWord.bind(this));


    this.scale$
      .observeOn(Rx.Scheduler.async)
      .do(this.scaleCanvas.bind(this))
      .observeOn(Rx.Scheduler.async)
      .do(this.scrollCanvas.bind(this))
      .observeOn(Rx.Scheduler.async)
      .do(this.resizeCanvasContainer.bind(this))
      .subscribe((event) => {
        // console.log('GoogleComponent.onScale():', event);
      });
  }

  prepareCanvas() {
    $(this.MSG_CONTAINER_SELECTOR).remove();
    $(this.CANVAS_SELECTOR).removeClass('hide');
    $(this.ZONE_CONTAINER_SELECTOR).addClass('overflow-scroll');
  }

  scaleCanvas(event) {
    $(this.CANVAS_SELECTOR).find('.konvajs-content').css('transform', 'scale(' + event.zoom + ')');
  }

  scrollCanvas(event) {
    $(this.ZONE_CONTAINER_SELECTOR)
      .scrollTop(event.scrollTop)
      .scrollLeft(event.scrollLeft);
  }

  resizeCanvasContainer(event) {
    $(this.CANVAS_SELECTOR).width(event.container_size.width);
    $(this.CANVAS_SELECTOR).height(event.container_size.height);
    return event;
  }

  processOCR(input) {
    $(this.MSG_SELECTOR).text('Calling Google. Hang on....');
    return Rx.Observable
      .ajax('http://localhost:8080/google/' + input.id)
      .catch(error => {
        $(this.MSG_SELECTOR).text('Google: OCR backend request failed.');
        console.log(error);
        return Rx.Observable.throw(error);
      })
      .pluck('response')
      .do(console.log)
      .flatMap(response => Rx.Observable.from(response['pages_']))
      .flatMap(pages => pages['blocks_'])
      .flatMap(blocks => blocks['paragraphs_'])
      .flatMap(paragraphs => paragraphs['words_'])
      .map(this.wordToOCRWord.bind(this))
      .do(null, (error)=>console.log(error))
      .toArray();
  }

  wordToOCRWord(word) {
    let topLeftPoint = word['boundingBox_']['vertices_'][0];
    let topRightPoint = word['boundingBox_']['vertices_'][1];
    let bottomRightPoint = word['boundingBox_']['vertices_'][2];
    let bottomLeftPoint = word['boundingBox_']['vertices_'][3];

    // there is no confidence_ level for Java SDK
    // let confidence = word.confidence_;
    let confidence = -1;
    let rect = {
      top: topLeftPoint.x_,
      left: topLeftPoint.y_,
      width: topRightPoint.x_ - topLeftPoint.x_,
      height: bottomLeftPoint.y_ - topLeftPoint.y_
    };
    let text = '';
    Rx.Observable
      .from(word.symbols_)
      .pluck('text_')
      .toArray()
      .subscribe(arr => text = arr.join(''));

    let box = {confidence, text, rect};
    return box;
  }

  publishWord(word) {
    this.words$.next(word);
  }
}
