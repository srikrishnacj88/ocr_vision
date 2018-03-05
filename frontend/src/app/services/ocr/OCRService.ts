import {Observable} from 'rxjs/Observable';

export interface OCRService {
  process(id: string): Observable<Array<Word>>;
}

export interface Word {
  text: string,
  rect: Rectangle,
  confidence: number
}

export class Rectangle {
  constructor(public top: number, public left: number, public width: number, public height: number) {
  }
}
