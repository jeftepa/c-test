import { Component } from '@angular/core';
import { StrategiesService } from './strategies/strategies.service';
import { stochastic } from 'technicalindicators';
import Binance, { CandlesOptions, CandleChartInterval, Candle, CandleChartResult } from 'binance-api-node';
import * as _ from 'underscore';
import * as Plotly from 'plotly.js';
import { StochasticStrategy } from './strategies/stochastic-strategy.controller';

interface IMyCandle {
  low: string;
  high: string;
  close: string;
  buy?: number;
  sell?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private strategy: Strategies.Strategy;
  private binance = Binance();
  private candles: IMyCandle[] = [];
  private webSocket: Function;

  public symbol = 'EOSETH';
  public period = 12;
  public signalPeriod = 5;
  public selectedStrategy = 'stochastic';
  public strategies: string[];

  constructor(private strategyService: StrategiesService) {
    this.strategies = this.strategyService.getStrategies();
    this.strategy = this.strategyService.getStochasticSegmentsStrategy();

    // const exchangeInfo = await this.binance.exchangeInfo();
    // exchangeInfo.symbols;
  }

  public async ngOnInit(): Promise<void> {
    this.strategy.reset();

    // this.runLive();
    await this.runHistoricAnalysis(this.symbol, '1m', 100);
  }

  public async onRefresh(): Promise<void> {
    if (this.selectedStrategy !== this.strategy.name) {
      this.strategy = this.strategyService.getStrategy(this.selectedStrategy);
    }

    this.strategy.reset();

    // this.webSocket();
    // this.runLive();
    await this.runHistoricAnalysis(this.symbol, '1m', 100);
  }

  private async runLive(): Promise<void> {
    this.candles = await this.binance.candles({ symbol: this.symbol, interval: '1m', limit: 100 });
    this.runAnalysis();
    
    this.webSocket = this.binance.ws.candles(this.symbol, '1m', candle => {
      if (candle.isFinal) {
        this.candles.push(candle);
        this.runAnalysis();
      }
    });
  }

  private runAnalysis(): void {
    const high: number[] = _.pluck(this.candles, 'high');
    const low: number[] = _.pluck(this.candles, 'low');
    const close: number[] = _.pluck(this.candles, 'close');
    const range = _.range(this.candles.length);
    
    const stoch = stochastic({
      low: low,
      high: high,
      close: close,
      period: this.period,
      signalPeriod: this.signalPeriod
    });

    const k = this.fillArray<number>(_.pluck(stoch, 'k'), this.candles.length);
    const d = this.fillArray<number>(_.pluck(stoch, 'd'), this.candles.length);

    const params: Strategies.IGetTradeAdvice = {
      k: k[k.length - 1],
      d: d[d.length - 1]
    }

    const advice = this.strategy.getTradeAdvice(params);
    console.log('i: ' + (k.length - 1));
    console.log('k: ' + k[k.length - 1]);
    console.log('d: ' + d[d.length -1]);
    console.log('advice: ' + advice);

    this.candles[this.candles.length - 1].buy = advice === 'buy' ? close[this.candles.length - 1] : undefined;
    this.candles[this.candles.length - 1].sell = advice === 'sell' ? close[this.candles.length - 1] : undefined;

    const buy = this.fillArray<number>(_.pluck(this.candles, 'buy'), this.candles.length);
    const sell = this.fillArray<number>(_.pluck(this.candles, 'sell'), this.candles.length);

    this.plotCandleChart(low, high, close, range, buy, sell);
    this.plotStochChart(k, d, range);
  }
  
  private async runHistoricAnalysis(symbol: string, interval: CandleChartInterval, limit: number): Promise<void> {
    this.candles = await this.binance.candles({ symbol: symbol, interval: interval, limit: limit });
    const high: number[] = _.pluck(this.candles, 'high');
    const low: number[] = _.pluck(this.candles, 'low');
    const close: number[] = _.pluck(this.candles, 'close');
    const range = _.range(low.length);

    const stoch = stochastic({
      low: low,
      high: high,
      close: close,
      period: this.period,
      signalPeriod: this.signalPeriod
    });

    const k = this.fillArray<number>(_.pluck(stoch, 'k'), low.length);
    const d = this.fillArray<number>(_.pluck(stoch, 'd'), low.length);

    const params: Strategies.IGetTradeAdvice[] = this.unPluck(k, d, 'k', 'd');

    const adviceBatch = this.strategy.getTradeAdviceBatch(params);

    this.setAdvice(adviceBatch, close);

    const buy = this.fillArray<number>(_.pluck(this.candles, 'buy'), this.candles.length);
    const sell = this.fillArray<number>(_.pluck(this.candles, 'sell'), this.candles.length);

    this.plotCandleChart(low, high, close, range, buy, sell);
    this.plotStochChart(k, d, range);
  }

  private setAdvice(adviceBatch: Strategies.advice[], close: number[]): void {
    _.each(adviceBatch, (advice, i) => {
      this.candles[i].buy = advice === 'buy' ? close[i] : undefined;
      this.candles[i].sell = advice === 'sell' ? close[i] : undefined;
    });
  }

  private unPluck(value1: number[], value2: number[], key1: string, key2: string): Strategies.IGetTradeAdvice[] {
    const value: Strategies.IGetTradeAdvice[] = [];

    let i = 0;
    while(i < value1.length) {
      value.push({
        [key1]: value1[i],
        [key2]: value2[i]
      });
      i++;
    }

    return value;
  }

  private fillArray<T>(original: T[], requiredLength): T[] {
    const newData: T[] = _.range(requiredLength).map(() => undefined);
    const shiftData = requiredLength > original.length ? requiredLength - original.length : 0;

    _.each(original, (value, key) => {
      newData[key + shiftData] = value;
    });

    return newData;
  }

  private plotStochChart(k: number[], d: number[], range: number[]): void {
    const kTrace = {
      x: range,
      y: k,
      type: <'scatter'>'scatter'
    };
    const dTrace = {
      x: range,
      y: d,
      type: <'scatter'>'scatter'
    };

    const stochData = [kTrace, dTrace];
    Plotly.newPlot('stoch-chart', stochData);
  }

  private plotCandleChart(low: number[], high: number[], close: number[], range: number[], buy?: number[], sell?: number[]): void {
    const buyTrace = {
      x: range,
      y: buy,
      mode: <'markers'>'markers',
      marker: {
        color: 'rgb(75, 244, 66)',
        size: 10
      }
    };
    const sellTrace = {
      x: range,
      y: sell,
      mode: <'markers'>'markers',
      marker: {
        color: 'rgb(247, 66, 42)',
        size: 10
      }
    };
    const lowTrace = {
      x: range,
      y: low,
      type: <'scatter'>'scatter'
    };
    const highTrace = {
      x: range,
      y: high,
      type: <'scatter'>'scatter'
    };
    const closeTrace = {
      x: range,
      y: close,
      type: <'scatter'>'scatter'
    };

    const candleData = [lowTrace, highTrace, closeTrace, buyTrace, sellTrace];
    Plotly.newPlot('candle-chart', candleData);
  }
}
