import {Injectable} from '@angular/core';
import * as Logger from 'loglevel';
import * as Prefixer from 'loglevel-plugin-prefix';

@Injectable()
export class LoggerService {

  private static isInit = false;

  static getLogger(name) {
    if(!LoggerService.isInit){
      LoggerService.prefix(Logger)
      LoggerService.isInit = true;
    }
    let logger = Logger.getLogger(name);
    logger.setLevel('trace');
    return logger;
  }

  private static prefix(logger) {
    var originalFactory = logger.methodFactory;
    logger.methodFactory = function (methodName, logLevel, loggerName) {
      var rawMethod = originalFactory(methodName, logLevel, loggerName);

      return function (message) {
        rawMethod(loggerName + ':\t' + message);
      };
    };
    logger.setLevel(logger.getLevel()); // Be sure to call setLevel method in order to apply plugin
  }
}
