import {Injectable} from '@angular/core';
import {CanvasService} from './canvas.service';
import {Word} from './OCRService';
import {AppUtilService} from '../app-util.service';
import * as Rx from '../../../node_modules/rxjs';
import {LoggerService} from '../logger.service';

declare var Konva;

@Injectable()
export class KonvaCanvasService {
  static logger = LoggerService.getLogger('KonvaCanvasService');

  static create(SELECTOR, URL) {
    console.log(SELECTOR);
    return AppUtilService
      .createIMG(URL)
      .switchMap((img) => this.imageToCanvas(img, SELECTOR));
  }

  static setWords(canvas: any, words: Array<Word>) {
    if(words.length == 0){
      canvas.stage.draw();
      return;
    }
    Rx.Observable.from(words)
      .map(word => Object.assign({}, {canvas, word}))
      // .observeOn(Rx.Scheduler.async)
      .do(KonvaCanvasService.renderWordBG)
      .do(KonvaCanvasService.renderWordText)
      .do(null, null, () => canvas.stage.draw())
      .subscribe();
  }

  draw(canvas: any) {
    canvas.draw();
  }

  private static imageToCanvas(img, SELECTOR) {
    let ID = (Math.round(Math.random()) * 100000000) + '';

    let scale = 1;
    let stage = new Konva.Stage({
      container: (SELECTOR),   // id of container <div>
      width: img.width * scale,
      height: img.height * scale,
      fill: 'green'
    });

    let bgLayer = new Konva.Layer({id: 'BG_LAYER' + ID});
    let imgLayer = new Konva.Layer({id: 'IMG_LAYER' + ID});
    let rectLayer = new Konva.Layer({id: 'RECT_LAYER' + ID});
    let wordLayer = new Konva.Layer({id: 'WORD_LAYER' + ID});

    stage.add(bgLayer);
    stage.add(imgLayer);
    stage.add(rectLayer);
    stage.add(wordLayer);

    let bgColor = new Konva.Rect({
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
      fill: '#eee',
    });
    bgLayer.add(bgColor);

    let konvaImg = new Konva.Image({
      image: img,
      width: stage.width(),
      height: stage.height()
    });
    imgLayer.add(konvaImg);

    let canvas = {ID, rectLayer, wordLayer, stage: stage};
    let isStageVisible = () => {
      let rectLayer = stage.findOne('#RECT_LAYER' + ID);
      let wordLayer = stage.findOne('#WORD_LAYER' + ID);
      let isReady = typeof rectLayer !== 'undefined' && typeof wordLayer !== 'undefined';
      return isReady;
    };

    return Rx.Observable.create(observer => {
      AppUtilService.emmitWhen(canvas, isStageVisible).subscribe((obj) => {
        observer.next(obj);
        obj.stage.draw();
      });
      return () => canvas.stage.remove();
    });
  }

  private static renderWordBG(data) {
    let word = data.word;
    let color = '154,205,50';
    if (word.confidence == -1) {
      word.confidence = 1;
      color = '255,169,0';
    }

    let fill = 'rgba(' + color + ',' + word.confidence + ')';
    let canvasBox = new Konva.Rect({
      x: word.rect.top,
      y: word.rect.left,
      width: word.rect.width,
      height: word.rect.height,
      fill,
    });
    data.canvas.rectLayer.add(canvasBox);
  }

  private static renderWordText(data) {
    let word = data.word;
    let fontSize = AppUtilService.calFontSize(word.text, word.rect.width, word.rect.height);
    var canvasText = new Konva.Text({
      x: word.rect.top,
      y: word.rect.left,
      text: word.text,
      fontSize,
      // fontFamily: 'arial',
      fill: 'black'
    });
    data.canvas.wordLayer.add(canvasText);
  }
}
