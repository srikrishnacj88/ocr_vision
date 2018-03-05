import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {AppUtilService} from '../app-util.service';
import * as Rx from 'rxjs';
import {LoggerService} from '../logger.service';
import {KonvaCanvasService} from '../services/konva-canvas.service';

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
  @Input('inputs') inputs: any;
  @ViewChild('container') CONTAINER: ElementRef;

  private canvas: any;

  constructor() {
  }

  ngOnInit() {
    this.logger = LoggerService.getLogger(this.logname);
    let ID = (Math.round(Math.random() + 1) * 100000000) + '';
    this.CONTAINER.nativeElement.id = ID;

    let canvas$ = this.inputs
      .imageToCanvas$
      .pluck('fileMap')
      .switchMap((event: any) => KonvaCanvasService.create(ID, 'http://localhost:8080/image/' + event.id))
      // .subscribe();

    let words$ = this.inputs
      .words$;

    Rx.Observable
      .zip(words$, canvas$, (words, canvas) => {
        return {canvas, words};
      })
      .do(console.log)
      .subscribe((obj: any) => {
        KonvaCanvasService.setWords(obj.canvas, obj.words);
      });

    // let canvas$ = this.inputs.imageToCanvas$
    //   .pluck('fileMap')
    //   // .switchMap((event: any) => this.imageToCanvas.call(this, event.img, this.CONTAINER))
    //   .do(console.log)
    //   .switchMap((event: any) => KonvaCanvasService.create(ID, 'http://localhost:8080/image/' + event.id))
    //   .do(this.log('Canvas visible and ready to use'))
    //   .do(this.log('Trigger canvas redraw'))
    //   .do((canvas: any) => canvas.stage.draw())
    //   .do((canvas: any) => {
    //     this.canvas = canvas.stage;
    //   })
    //   .do(null, (error) => {
    //     this.log('Something went wrong while processing new IMG event' + error)();
    //     console.error(error);
    //   });


    this.inputs.canvasScale$.subscribe(scale => {
      try {
        this.canvas.scaleX(scale);
        this.canvas.scaleY(scale);
        this.canvas.draw();

        const $konva = $(this.CONTAINER.nativeElement).find('.konvajs-content');
        const width = this.canvas.width() * scale;
        const height = this.canvas.height() * scale;

        $konva
          .width(width)
          .height(height);
      } catch (e) {
        console.error(e);
      }
    });
    // Rx.Observable
    //   .zip(this.inputs.words$.do(this.log('ocr words event received')), canvas$, (words, canvas) => {
    //     return {canvas, words};
    //   })
    //   //   .observeOn(Rx.Scheduler.async)
    //   .do((state: any) => this.log('processing ocr words. size:' + state.words.length)())
    //   .do((state: any) => {
    //     let canvas = state.canvas;
    //     Rx.Observable.from(state.words)
    //       .map(word => Object.assign({}, {canvas, word}))
    //       // .observeOn(Rx.Scheduler.async)
    //       .do(this.renderWordBG.bind(this))
    //       .do(this.renderWordText.bind(this))
    //       .do(null, null, () => state.canvas.stage.draw())
    //       .subscribe();
    //   })
    //   .subscribe(null, null, null);
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
