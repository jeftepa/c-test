import { Injectable } from '@angular/core';
import * as _ from 'underscore';

@Injectable()
export class TradingService {
  public balance1 = 0;
  public balance2 = 0;

  constructor() { }

  public reset(): void {
    this.balance1 = 0;
    this.balance2 = 0;
  }

  public doTradeBatch(adviceBatch: Strategies.advice[], close: number[]): void {    
    _.each(adviceBatch, (advice, a) => {
      this.doTrade(advice, close[a]);
    });
  }

  public doTrade(advice: Strategies.advice, close: number): void {
    if (advice === 'buy') {
      this.doBuy(close);
    } else if (advice === 'sell') {
      this.doSell(close);
    }
  }

  private doBuy(close: number): void {
    this.balance2 += (close * this.balance1);
    this.balance1 = 0;
  }

  private doSell(close: number): void {
    this.balance1 += (this.balance2 / close);
    this.balance2 = 0;
  }
}
