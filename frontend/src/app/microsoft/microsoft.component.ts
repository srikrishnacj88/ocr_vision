import {Component, Input, OnInit} from '@angular/core';
import * as Rx from 'rxjs/Rx';

declare var $;

@Component({
  selector: 'app-microsoft',
  templateUrl: './microsoft.component.html',
  styleUrls: ['./microsoft.component.css']
})
export class MicrosoftComponent implements OnInit {
  @Input('image$') image$: Rx.Observable<any>;
  @Input('scale$') scale$: Rx.Observable<any>;
  public words$ = new Rx.Subject();

  private ZONE_SELECTOR = '#microsoftzone';
  private ZONE_CONTAINER_SELECTOR = this.ZONE_SELECTOR + ' .zone-container';
  private CANVAS_SELECTOR = this.ZONE_SELECTOR + ' app-ocr-canvas';
  private MSG_CONTAINER_SELECTOR = this.ZONE_SELECTOR + ' .message';
  private MSG_SELECTOR = this.ZONE_SELECTOR + ' .message h1';

  constructor() {
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
        // console.log('MicrosoftComponent.onScale():', event);event
      });
  }

  prepareCanvas() {
    $(this.MSG_CONTAINER_SELECTOR).remove();
    $(this.CANVAS_SELECTOR).removeClass('hide');
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
    $(this.MSG_SELECTOR).text('Calling Microsoft. Hang on....');
    return Rx.Observable
      .ajax('http://localhost:8080/microsoft/' + input.id)
      .catch(error => {
        $(this.MSG_SELECTOR).text('Microsoft: OCR backend request failed.');
        console.log(error);
        return Rx.Observable.throw(error);
      })
      .pluck('response')
      .flatMap(response => response['regions'])
      .flatMap(regions => regions['lines'])
      .flatMap(lines => lines['words'])
      .map(this.wordToOCRWord.bind(this))
      .toArray()
  }

  wordToOCRWord(word) {
    let bounding = word.boundingBox.split(',');

    let confidence = -1;
    let rect = {
      top: bounding[0],
      left: bounding[1],
      width: bounding[2],
      height: bounding[3]
    };
    let text = word.text;

    let box = {confidence, text, rect};
    return box;
  }

  publishWord(word) {
    this.words$.next(word);
  }
}
