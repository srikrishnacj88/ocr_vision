import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';


import {AppComponent} from './app.component';
import {OcrComponent} from './ocr/ocr.component';
import {MicrosoftService} from './services/ocr/microsoft.service';
import {GoogleService} from './services/ocr/google.service';
import {AbbyyLineService} from './services/ocr/abbyy.line.service';
import {AbbyyCharService} from './services/ocr/abbyy.char.service';
import {UploadService} from './services/upload.service';


@NgModule({
  declarations: [
    AppComponent,
    OcrComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [MicrosoftService, GoogleService, AbbyyLineService, AbbyyCharService, UploadService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
