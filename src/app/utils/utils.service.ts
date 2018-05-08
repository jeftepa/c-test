import { Injectable } from '@angular/core';
import * as _ from 'underscore';

@Injectable()
export class UtilsService {

  constructor() { }

  public unPluck(values: number[][], keys: string[]): Strategies.IAnalysisData[] {    
    const result: Strategies.IAnalysisData[] = [];

    let i = 0;
    while(i < values[0].length) {
      const test: Strategies.IAnalysisData = {};

      let j = 0;
      while(j < values.length) {
        test[keys[j]] = values[j][i];
        j++;
      }

      result.push(test);
      i++;
    };

    return result;
  }

  public fillArray<T>(original: T[], requiredLength): T[] {
    const newData: T[] = _.range(requiredLength).map(() => undefined);
    const shiftData = requiredLength > original.length ? requiredLength - original.length : 0;

    _.each(original, (value, key) => {
      newData[key + shiftData] = value;
    });

    return newData;
  }
}
