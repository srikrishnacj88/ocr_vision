import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as Rx from 'rxjs/Rx';
import {LoggerService} from './services/logger.service';
import {MicrosoftService} from './services/ocr/microsoft.service';
import {GoogleService} from './services/ocr/google.service';
import {AbbyyLineService} from './services/ocr/abbyy.line.service';
import {AppUtilService} from './services/app-util.service';
import {AbbyyCharService} from './services/ocr/abbyy.char.service';

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
              private abbyyLineService: AbbyyLineService,
              private abbyyCharService: AbbyyCharService) {
  }

  ngOnInit(): void {
    this.logger = LoggerService.getLogger('AppComponent');

    let service: any = this.createOCRService('OCR_PLAYER_1', 'PREVIEW');
    this.ocrService.push(service);

    service = this.createOCRService('OCR_PLAYER_3', 'GOOGLE');
    service.ocr = this.googleService;
    this.ocrService.push(service);

    service = this.createOCRService('OCR_PLAYER_2', 'MICROSOFT');
    service.ocr = this.microsoftService;
    this.ocrService.push(service);

    service = this.createOCRService('OCR_PLAYER_4', 'ABBYY_LINE');
    service.ocr = this.abbyyLineService;
    this.ocrService.push(service);

    service = this.createOCRService('OCR_PLAYER_5', 'ABBYY_CHAR');
    service.ocr = this.abbyyCharService;
    this.ocrService.push(service);


    this.ocrService.forEach((service) => {
      service.imageOT$.subscribe(this.onImage.bind(this));
      service.scrollOT$.subscribe(this.onScroll.bind(this));
      service.zoomOT$.subscribe(this.onZoom.bind(this));
    });

    AppUtilService.fromDropGetImages('body').subscribe();
    AppUtilService.fromEventZoom('body').subscribe();
  }

  private createOCRService(id, name) {
    return {
      id, name,
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

  onScroll(event) {
    // this.logger.info('Propagating SCALE Event:' + JSON.stringify(event));
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

  toggleService(service, $event) {
    $('#' + service.id).toggleClass('hide');
    $($event.target).toggleClass('active');
  }
}
