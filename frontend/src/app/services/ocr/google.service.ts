import {Injectable} from '@angular/core';
import {OCRService, Word} from './OCRService';
import {Observable} from 'rxjs/Observable';
import * as Rx from 'rxjs/Rx';
import {LoggerService} from '../logger.service';
import {AppUtilService} from '../app-util.service';

@Injectable()
export class GoogleService implements OCRService {
  private URL = AppUtilService.SERVER_BASE + 'google/';
  private logger = LoggerService.getLogger('GoogleService');

  process(id: string): Observable<Array<any>> {
    let res$ = Rx.Observable
      .ajax(this.URL + id)
      .pluck('response')
      .flatMap(response => Rx.Observable.from(response['pages_']))
      .flatMap(pages => pages['blocks_'])
      .flatMap(blocks => blocks['paragraphs_'])
      .flatMap(paragraphs => paragraphs['words_'])
      .map(this.wordToOCRWord.bind(this))
      .toArray();
    return res$;
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

    return {confidence, text, rect};
  }
}
