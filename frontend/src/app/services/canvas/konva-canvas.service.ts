import {Injectable} from '@angular/core';
import {CanvasService} from './canvas.service';
import {Word} from '../ocr/OCRService';
import {AppUtilService} from '../app-util.service';
import * as Rx from '../../../../node_modules/rxjs/Rx';
import {LoggerService} from '../logger.service';

declare var Konva;
declare var $;

@Injectable()
export class KonvaCanvasService {
  static logger = LoggerService.getLogger('KonvaCanvasService');
  private static scaleRatio = 0.5;

  static create(SELECTOR, URL) {
    return AppUtilService
      .createIMG(URL)
      .do(KonvaCanvasService.calculateScalling)
      .switchMap((img) => this.imageToCanvas(img, SELECTOR));
  }

  static calculateScalling(img) {
    if (img.width > 1200) {
      KonvaCanvasService.scaleRatio = 0.5;
    } else if (img.height > 1200) {
      KonvaCanvasService.scaleRatio = 0.5;
    } else {
      KonvaCanvasService.scaleRatio = 1;
    }
  }

  static setWords(canvas: any, words: Array<Word>) {
    if (words.length == 0) {
      canvas.stage.draw();
      return;
    }
    Rx.Observable.from(words)
      .filter(word => !!word)
      .map(word => Object.assign({}, {canvas, word}))
      .do(KonvaCanvasService.renderWordBG)
      .do(KonvaCanvasService.renderWordText)
      .do(null, null, () => canvas.stage.draw())
      .subscribe();
  }

  draw(canvas: any) {
    canvas.draw();
  }

  private static imageToCanvas(img, SELECTOR) {
    let ID = SELECTOR + '_KONVA';

    let stage = new Konva.Stage({
      id: ID,
      container: (SELECTOR),   // id of container <div>
      width: KonvaCanvasService.scale(img.width),
      height: KonvaCanvasService.scale(img.height),
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
    // console.log('renderWordBG');
    // console.log(JSON.stringify(data.word));

    let word = data.word;
    let color = '154,205,50';
    if (word.confidence == -1) {
      word.confidence = 1;
      color = '255,169,0';
    }

    let fill = 'rgba(' + color + ',' + word.confidence + ')';
    let canvasBox = new Konva.Rect({
      x: KonvaCanvasService.scale(word.rect.top),
      y: KonvaCanvasService.scale(word.rect.left),
      width: KonvaCanvasService.scale(word.rect.width),
      height: KonvaCanvasService.scale(word.rect.height),
      fill,
    });
    data.canvas.rectLayer.add(canvasBox);
    // data.canvas.rectLayer.draw();
  }

  private static renderWordText(data) {
    // console.log('renderWordText');
    // console.log(JSON.stringify(data.word));

    // debugger
    let word = data.word;
    word.text = word.text + '';
    word.text = KonvaCanvasService.trimTrallingDot(word.text);

    let fontSize = AppUtilService.calFontSize(word.text, word.rect.width, word.rect.height);
    fontSize = KonvaCanvasService.scale(fontSize);
    var canvasText = new Konva.Text({
      x: KonvaCanvasService.scale(word.rect.top),
      y: KonvaCanvasService.scale(word.rect.left),
      text: word.text,
      fontSize,
      // fontFamily: 'arial',
      fill: 'black'
    });
    data.canvas.wordLayer.add(canvasText);
    // data.canvas.wordLayer.draw();
  }

  private static scale(number) {
    return number * KonvaCanvasService.scaleRatio;
  }

  public static scaleFor(scale, number) {
    return scale * number;
  }

  static zoom(canvas, zoom) {
    if (zoom > 1) {
      $(canvas.stage.getContainer()).css('transform', 'scale(' + zoom + ')');
      $(canvas.stage.getContainer()).css('transform-origin', 'top left');
    } else {
      $(canvas.stage.getContainer()).css('transform', 'scale(1)');
      canvas.stage.scaleX(zoom);
      canvas.stage.scaleY(zoom);
      canvas.stage.draw();
    }
  }

  static getWidth(canvas) {
    return canvas.stage.getWidth();
  }

  static getHeight(canvas) {
    return canvas.stage.getHeight();
  }

  static trimTrallingDot(text) {
    return text;

    // let isDotEnding = text.charAt(text.length - 1) === '.';
    // if (isDotEnding) {
    //   text = text.substr(0, text.length - 1);
    //   return KonvaCanvasService.trimTrallingDot(text) + '$';
    // } else {
    //   return text;
    // }
  }
}
