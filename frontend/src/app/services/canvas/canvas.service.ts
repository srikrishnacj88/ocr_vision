import {Word} from '../ocr/OCRService';

export interface CanvasService {
  create(SELECTOR, URL);
  setWords(words: Array<Word>);
  draw();
}
