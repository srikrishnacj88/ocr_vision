import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as Rx from 'rxjs/Rx';
import {LoggerService} from './logger.service';
import {MicrosoftService} from './services/microsoft.service';
import {GoogleService} from './services/google.service';
import {AbbyyService} from './services/abbyy.service';

declare var $;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private logger: any;
  ocrService = new Array<any>();

  constructor(private microsoftService: MicrosoftService,
              private googleService: GoogleService,
              private abbyyService: AbbyyService) {

  }

  ngOnInit(): void {
    this.logger = LoggerService.getLogger('AppComponent');

    let service: any = this.createOCRService('OCR_PLAYER_1');
    this.ocrService.push(service);

    service = this.createOCRService('OCR_PLAYER_2');
    service.ocr = this.microsoftService;
    this.ocrService.push(service);

    service = this.createOCRService('OCR_PLAYER_3');
    service.ocr = this.googleService;
    this.ocrService.push(service);

    service = this.createOCRService('OCR_PLAYER_4');
    service.ocr = this.abbyyService;
    this.ocrService.push(service);

    this.ocrService.forEach((service) => {
      service.imageOT$.subscribe(this.onImage.bind(this));
      service.scrollOT$.subscribe(this.onScale.bind(this));
      service.zoomOT$.subscribe(this.onZoom.bind(this));
    });
  }

  private createOCRService(id) {
    return {
      id: id,
      imageIN$: new Rx.Subject(),
      imageOT$: new Rx.Subject(),
      scrollIN$: new Rx.Subject(),
      scrollOT$: new Rx.Subject(),
      zoomIN$: new Rx.Subject(),
      zoomOT$: new Rx.Subject()
    };
  }

  onImage(event) {
    this.logger.info('Propagating IMAGE Event:' + JSON.stringify(event));
    this.ocrService.forEach((service) => {
      if (service.id === event.id) {
        return;
      }
      service.imageIN$.next(event);
    });
  }

  onScale(event) {
    this.logger.info('Propagating SCALE Event:' + JSON.stringify(event));
    this.ocrService.forEach((service) => {
      if (service.id === event.id) {
        return;
      }
      service.scrollIN$.next(event);
    });
  }

  onZoom(event) {
    this.logger.info('Propagating ZOOM Event:' + JSON.stringify(event));
    this.ocrService.forEach((service) => {
      if (service.id === event.id) {
        return;
      }
      service.zoomIN$.next(event);
    });
  }
}
