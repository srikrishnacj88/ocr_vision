import {Component, Input, OnInit} from '@angular/core';
import * as Rx from 'rxjs';
import {from} from 'rxjs/observable/from';
import {LoggerService} from '../logger.service';

declare var $;

@Component({
  selector: 'app-abby',
  templateUrl: './abby.component.html',
  styleUrls: ['./abby.component.css']
})
export class AbbyComponent implements OnInit {
  @Input('image$') image$: Rx.Observable<any>;
  @Input('scale$') scale$: Rx.Observable<any>;
  public words$ = new Rx.Subject();
  private logger: any;

  private ZONE_SELECTOR = '#abbyyzone';
  private ZONE_CONTAINER_SELECTOR = this.ZONE_SELECTOR + ' .zone-container';
  private CANVAS_SELECTOR = this.ZONE_SELECTOR + ' app-ocr-canvas';
  private MSG_CONTAINER_SELECTOR = this.ZONE_SELECTOR + ' .message';
  private MSG_SELECTOR = this.ZONE_SELECTOR + ' .message h1';

  constructor() {
    this.logger = LoggerService.getLogger('OcrCanvasComponent');
  }

  ngOnInit() {
    this.image$
      .switchMap(this.processOCR.bind(this))
      .do(this.prepareCanvas.bind(this))
      // Image will be published to child due to shared input
      .subscribe(this.publishWord.bind(this));


    this.scale$
      .do(console.log)
      .do(this.scaleCanvas.bind(this))
      .do(this.scrollCanvas.bind(this))
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
    $(this.MSG_SELECTOR).text('Calling ABBYY. Hang on....');
    return Rx.Observable
      .ajax('http://localhost:8080/abbyy/' + input.id)
      .pluck('response')
      .do(console.log)
      .pluck('document')
      .map(doc => {
        return this.flatObj(doc, []);
      })
      .flatMap(chars => from(chars))
      .filter(obj => 'content' in obj)
      .map(this.wordToOCRWord.bind(this))
      .toArray()
      .catch(error => {
        $(this.MSG_SELECTOR).text('ABBYY: OCR backend request failed.');
        console.error(error);
        return Rx.Observable.throw(error);
      });
  }

  wordToOCRWord(word) {
    /** (Left, Top) (Right, Bottom)**/
    let confidence = 1;
    if (word.suspicious) {
      confidence = -1;
    }

    let rect = {
      top: word.l,
      left: word.t,
      width: word.b - word.t,
      height: word.r - word.l
    };
    let text = word.content;

    let box = {confidence, text, rect};
    return box;
  }

  publishWord(word) {
    this.words$.next(word);
  }


  flatObj(obj, objArr) {
    for (let key in obj) {
      let value = obj[key];

      if (Array.isArray(value)) {
        value.forEach(item => {
          if (this.hasChildObj(item)) {
            this.flatObj(item, objArr);
          } else {
            objArr.push(item);
          }
        });
      } else if (value instanceof Object) {
        if (this.hasChildObj(value)) {
          this.flatObj(value, objArr);
        } else {
          objArr.push(value);
        }
      }
    }
    return objArr;
  }

  isObj(obj) {
    return typeof obj === 'object';
  }

  isArray(obj) {
    return Array.isArray(obj);
  }

  hasChildObj(obj) {
    for (let key in obj) {
      var value = obj[key];
      if (this.isObj(value)) {
        return true;
      }
    }
  }
}
