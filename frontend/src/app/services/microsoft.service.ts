import {Injectable} from '@angular/core';
import {AppUtilService} from '../app-util.service';
import {LoggerService} from '../logger.service';
import * as Rx from 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';
import {OCRService, Word} from './OCRService';

@Injectable()
export class MicrosoftService implements OCRService {
  private URL = AppUtilService.SERVER_BASE + 'microsoft/';
  private logger = LoggerService.getLogger('MicrosoftService');

  process(id: string): Observable<Array<any>> {
    let res$ = Rx.Observable
      .ajax(this.URL + id)
      .pluck('response')
      .flatMap(response => response['regions'])
      .flatMap(regions => regions['lines'])
      .flatMap(lines => lines['words'])
      .map(MicrosoftService.wordToOCRWord)
      .toArray();
    return res$;
  }

  static wordToOCRWord(word): Word {
    let bounding = word.boundingBox.split(',');
    let confidence = -1;
    let rect = {
      top: bounding[0],
      left: bounding[1],
      width: bounding[2],
      height: bounding[3]
    };
    let text = word.text;
    const box = {confidence, text, rect};
    return box;
  }
}
