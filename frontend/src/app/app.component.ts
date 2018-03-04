import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import * as Rx from 'rxjs/Rx';

declare var $;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private DROP_ZONE_SELECTOR = '.dropzone';
  image$ = new Rx.Subject();
  scale$ = new Rx.Subject();

  ngOnInit(): void {

  }

  onImage(event) {
    // console.log('AppComponent.onImage(): ', event);
    this.image$.next(event);
  }

  onScale(event) {
    this.scale$.next(event);
    // console.log('AppComponent.onScale(): ', event);
  }
}
