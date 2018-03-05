import {Injectable} from '@angular/core';
import * as Rx from 'rxjs';

declare var $;

@Injectable()
export class AppUtilService {

  static SERVER_BASE = 'http://localhost:8080/';

  static fromDropGetImages(selector) {
    function getFiles(event) {
      var dt = event.dataTransfer;
      var files = [];
      for (var i = 0; i < dt.items.length; i++) {
        if (dt.items[i].kind == 'file') {
          var f = dt.items[i].getAsFile();
          files.push(f);
        }
      }
      return files;
    }

    function isFile(file) {
      var isFolder = !file.type && file.size % 4096 == 0;
      return !isFolder;
    }

    function isImage(file) {
      var imageType = /image.*/;
      return file.type.match(imageType);
    }

    var drop$ = Rx.Observable.create(observer => {
      var $dropZone = $(selector);

      $dropZone.on('dragover', (event) => {
        event.stopPropagation();
        event.preventDefault();
      });

      $dropZone.on('drop', (event) => {
        event.stopPropagation();
        event.preventDefault();

        observer.next(event);
      });

      return function () {
        $(selector).off('dragover');
        $(selector).off('drop');
      };
    });

    return drop$
      .map(jevent => jevent.originalEvent)
      .flatMap(getFiles)
      .filter(isFile)
      .filter(isImage);
  }

  static fileToImgObj(id) {
    return Rx.Observable.create(observer => {
      var img = new Image();

      img.onload = function () {
        observer.next(img);
        observer.complete();
      };
      img.src = 'http://localhost:8080/image/' + id;
      return img;
    });
  }

  static createIMG(url) {
    return Rx.Observable.create(observer => {
      var img = new Image();
      img.onload = function () {
        observer.next(img);
        observer.complete();
      };
      img.src = url;
      return img;
    });
  }

  static fromEventZoom(selector) {
    let zoom$ = Rx.Observable.create(observer => {
      let listener = (event, delta) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.ctrlKey) {
          observer.next(delta);
        }
      };
      $(selector).on('mousewheel', listener);

      return () => {
        $(selector).off(listener);
      };
    });

    return zoom$
      .map(delta => delta == 1 ? 2 : -2)
      .scan((acc, val) => acc + val, 100)
      // .startWith(100)
      .map(val => val / 100);
  }

  static fromEventScroll(selector) {
    let scroll$ = Rx.Observable.create(observer => {
      let listener = (event) => {
        event.preventDefault();
        observer.next({scrollTop: event.target.scrollTop, scrollLeft: event.target.scrollLeft});
      };
      $(selector).on('scroll', listener);
      return () => {
        $(selector).off(listener);
      };
    });

    // return scroll$.startWith({scrollTop: 0, scrollLeft: 0});
    return scroll$;
  }

  static calFontSize(text, width, height) {
    let $helper = $('<div id="font-calc-helper"><span>' + text + '</span></div>');
    $helper.css('width', width);
    $helper.css('height', height);
    $helper.css('position', 'absolute');
    $helper.css('top', 0);
    $helper.css('left', 0);
    $helper.css('line-height', '1em');
    $helper.css('background-color', 'yellowgreen');
    $(document.body).append($helper);

    if (text === 'NAME') {
      console.log();
    }

    let safeSize = $helper.css('font-size').replace('px', '');
    safeSize = parseInt(safeSize);
    safeSize = AppUtilService.recursiveSearch(safeSize, (value) => {
      $helper.children('span').css('font-size', value + 'px');
      let isHeightOverflow = $helper[0].scrollHeight > $helper.innerHeight();
      let isWidthOverflow = $helper[0].scrollWidth > $helper.innerWidth();
      return !isHeightOverflow && !isWidthOverflow;
    });

    $helper.remove();
    return safeSize;
  }

  static oldCalFontSize = (function () {
    let $test = $('<span id=\'test\'/>').appendTo('body').css({
      visibility: 'hidden',
      border: 0,
      padding: 0,
      whiteSpace: 'pre'
    });
    let minFont = 10, maxFont = 100;
    return function (txt, fontFamily, size) {
      $test.appendTo('body').css({fontFamily: fontFamily})
        .text(txt);
      $test.css({fontSize: maxFont + 'px'});
      let maxWidth = $test.width();
      $test.css({fontSize: minFont + 'px'});
      let minWidth = $test.width();
      let width = (size - minWidth) * (maxFont - minFont) /
        (maxWidth - minWidth) + minFont;
      $test.detach();
      return (width - .1);
    };
  }());


  private static recursiveSearch(init, callback) {
    let counter = init;
    let stepSize = 2;
    let lastSuccess = counter;
    while (true) {
      if (callback(counter)) {
        lastSuccess = counter;
        counter += stepSize;
      } else {
        return lastSuccess;
      }
    }
  }

  static emmitWhen(obj, condition) {
    let ob$ = Rx.Observable.create(observer => {
      function waitFor(condition, emmit) {
        if (!condition()) {
          window.setTimeout(waitFor.bind(null, condition, emmit), 100);
        } else {
          emmit();
        }
      }

      let emmit = () => {
        observer.next(obj);
        observer.complete();
      };

      waitFor(condition, emmit);
    });
    return ob$;
  }
}
