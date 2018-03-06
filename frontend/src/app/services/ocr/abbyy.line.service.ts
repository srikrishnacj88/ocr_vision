import {Injectable} from '@angular/core';
import {OCRService, Rectangle, Word} from './OCRService';
import {Observable} from 'rxjs/Observable';
import {LoggerService} from '../logger.service';
import {AppUtilService} from '../app-util.service';
import {from} from 'rxjs/observable/from';
import * as Rx from 'rxjs';
import {ObjectUtil} from '../objectutil.service';

@Injectable()
export class AbbyyLineService implements OCRService {
  private URL = AppUtilService.SERVER_BASE + 'abbyy/';
  private logger = LoggerService.getLogger('AbbyyService');

  process(id: string): Observable<Array<any>> {
    let res$ = Rx.Observable
      .ajax(this.URL + id)
      .pluck('response')
      .pluck('document')
      .map(doc => {
        return ObjectUtil.pluckAllObjectsWithKey(doc, 'line', []);
      })
      .flatMap(lines => from(lines))
      .flatMap((line: any) => {
        // debugger
        if (ObjectUtil.isArray(line)) {
          return Rx.Observable.from(line);
        } else {
          return Rx.Observable.of(line);
        }
      })
      .catch(error => {
        console.log(error);
        return Rx.Observable.empty();
      })
      // .filter(obj => 'content' in obj)
      .map(this.wordToOCRWord.bind(this))
      .toArray();
    return res$;
  }

  wordToOCRWord(line) {
    /** (Left, Top) (Right, Bottom)**/
      // debugger;
    let confidence = -1;

    let top = line.l;
    let left = line.t;
    let width = line.r - line.l;
    let height = line.b - line.t;

    let rect = {
      top, left, width, height
    };

    let text = '';
    if (line.formatting) {
      if (line.formatting.charParams) {
        line.formatting.charParams.forEach(char => {
          if (char.content) {
            text += char.content;
          } else {
            text += ' ';
          }
        });
      } else if (line.formatting.content) {
        text += line.formatting.content;
      }
    }

    if (text === '') {
      // debugger;
    }

    let box = {confidence, text, rect};
    return box;
  }
}
