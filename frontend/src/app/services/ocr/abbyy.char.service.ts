import {Injectable} from '@angular/core';
import {OCRService, Word} from './OCRService';
import {Observable} from 'rxjs/Observable';
import {LoggerService} from '../logger.service';
import {AppUtilService} from '../app-util.service';
import {from} from 'rxjs/observable/from';
import * as Rx from 'rxjs';

@Injectable()
export class AbbyyCharService implements OCRService {
  private URL = AppUtilService.SERVER_BASE + 'abbyy/';
  private logger = LoggerService.getLogger('AbbyyService');

  process(id: string): Observable<Array<any>> {
    let res$ = Rx.Observable
      .ajax(this.URL + id)
      .pluck('response')
      .pluck('document')
      .map(doc => {
        return this.flatObj(doc, []);
      })
      .flatMap(chars => from(chars))
      .filter(obj => 'content' in obj)
      .map(this.wordToOCRWord.bind(this))
      .catch(error => {
        console.log(error);
        return Rx.Observable.empty();
      })
      .toArray();
    return res$;
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

    if (!rect.width || !rect.height) {
      this.logger.warn('SKIPPING char or line to avoid browser freeze.Unable to calculate width & height: ' + JSON.stringify(word));
      // this.logger.warn(word);
      return null;
    }
    let text = word.content;

    let box = {confidence, text, rect};
    return box;
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
