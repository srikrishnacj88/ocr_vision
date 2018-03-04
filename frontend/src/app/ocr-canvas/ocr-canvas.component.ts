import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {AppUtilService} from '../app-util.service';
import * as Rx from 'rxjs';
import {LoggerService} from '../logger.service';

declare var $;
declare var Konva;

@Component({
  selector: 'app-ocr-canvas',
  templateUrl: './ocr-canvas.component.html',
  styleUrls: ['./ocr-canvas.component.css']
})
export class OcrCanvasComponent implements OnInit {
  private logger: any;
  @Input('logname') logname: string;
  @Input('image$') image$: Rx.Observable<any>;
  @Input('words$') words$: Rx.Observable<any>;
  @ViewChild('container') CONTAINER: ElementRef;

  constructor() {
  }

  ngOnInit() {
    this.logger = LoggerService.getLogger(this.logname);

    let canvas$ = this.image$
      .do(this.log('Img event received'))
      .observeOn(Rx.Scheduler.async)
      .switchMap(this.fileToImgObj.bind(this))
      // .observeOn(Rx.Scheduler.async)
      .switchMap(img => this.imageToCanvas.call(this, img, this.CONTAINER))
      .do(this.log('Canvas visible and ready to use'))
      .do(this.log('Trigger canvas redraw'))
      // .observeOn(Rx.Scheduler.async)
      // .do((canvas: any) => canvas.stage.draw())
      .do(null, (error) => {
        this.log('Something went wrong while processing new IMG event' + error)();
        console.error(error);
      });

    Rx.Observable
      .zip(this.words$.do(this.log('ocr words event received')), canvas$, (words, canvas) => {
        return {canvas, words};
      })
      .observeOn(Rx.Scheduler.async)
      .do(state => this.log('processing ocr words. size:' + state.words.length)())
      .do((state: any) => {
        let canvas = state.canvas;
        Rx.Observable.from(state.words)
          .map(word => Object.assign({}, {canvas, word}))
          // .observeOn(Rx.Scheduler.async)
          .do(this.renderWordBG.bind(this))
          .do(this.renderWordText.bind(this))
          .do(null, null, () => state.canvas.stage.draw())
          .subscribe();
      })
      .subscribe(null, null, null);
  }

  fileToImgObj(input) {
    let file = input.file;
    return Rx.Observable.create(observer => {
      this.log('loading img')();
      var img = new Image();
      var reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target['result'];
        img.onload = () => {
          this.log('img loaded')();
          observer.next(img);
          observer.complete();
        };
      };
      reader.readAsDataURL(file);
      return img;
    });
  }

  imageToCanvas(img, containerRef) {
    let ID = (Math.random() * 100000000) + '';

    this.log('creating canvas')();
    let scale = 1;
    let stage = new Konva.Stage({
      container: containerRef.nativeElement,   // id of container <div>
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
      this.log('is canvas visible in dom?:' + isReady)();
      return isReady;
    };
    this.log('canvas created. waiting until it is visible in dom')();

    return Rx.Observable.create(observer => {
      AppUtilService.emmitWhen(canvas, isStageVisible).subscribe((obj) => {
        observer.next(obj);
      });
      return () => canvas.stage.remove();
    });
  }

  renderWordBG(data) {
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
    // data.canvas.rectLayer.draw()
  }

  renderWordText(data) {
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
    // data.canvas.wordLayer.draw();
  }

  log(msg) {
    return () => {
      this.logger.info(msg);
    };
  }
}
