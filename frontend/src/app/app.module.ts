import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';


import {AppComponent} from './app.component';
import {GoogleComponent} from './google/google.component';
import {MicrosoftComponent} from './microsoft/microsoft.component';
import {AbbyComponent} from './abby/abby.component';
import {ImageComponent} from './image/image.component';
import {AppUtilService} from './app-util.service';
import {OcrCanvasComponent} from './ocr-canvas/ocr-canvas.component';
import {LoggerService} from './logger.service';
import {OcrComponent} from './ocr/ocr.component';
import {MicrosoftService} from './services/microsoft.service';
import {GoogleService} from './services/google.service';
import {AbbyyService} from './services/abbyy.service';


@NgModule({
  declarations: [
    AppComponent,
    GoogleComponent,
    MicrosoftComponent,
    AbbyComponent,
    ImageComponent,
    OcrCanvasComponent,
    OcrComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [MicrosoftService, GoogleService, AbbyyService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
