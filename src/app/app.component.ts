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
  private strategy: StochasticStrategy;
  private binance = Binance();
  private candles: IMyCandle[] = [];

  private PERIOD = 10;
  private SIGNAL_PERIOD = 4;

  constructor(private strategyService: StrategiesService) {
    this.strategy = this.strategyService.getStochasticStrategy();
  }

  public async ngOnInit(): Promise<void> {
    this.candles = await this.binance.candles({ symbol: 'EOSETH', interval: '1m', limit: 100 });
    this.runAnalysis();
    
    this.binance.ws.candles('EOSETH', '1m', candle => {
      if (candle.isFinal) {
        this.candles.push(candle);
        this.runAnalysis();
      }
    });
    // await this.runHistoricAnalysis('EOSETH', '1m', 100);
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
      period: this.PERIOD,
      signalPeriod: this.SIGNAL_PERIOD
    });

    const k = this.fillArray<number>(_.pluck(stoch, 'k'), this.candles.length);
    const d = this.fillArray<number>(_.pluck(stoch, 'd'), this.candles.length);

    const advice = this.strategy.getTradeAdvice(k[k.length - 1], d[d.length - 1]);
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
    const hCandles = await this.binance.candles({ symbol: symbol, interval: interval, limit: limit });
    const high: number[] = _.pluck(hCandles, 'high');
    const low: number[] = _.pluck(hCandles, 'low');
    const close: number[] = _.pluck(hCandles, 'close');
    const range = _.range(low.length);

    const stoch = stochastic({
      low: low,
      high: high,
      close: close,
      period: this.PERIOD,
      signalPeriod: this.SIGNAL_PERIOD
    });

    const k = this.fillArray<number>(_.pluck(stoch, 'k'), low.length);
    const d = this.fillArray<number>(_.pluck(stoch, 'd'), low.length);

    this.plotCandleChart(low, high, close, range);
    this.plotStochChart(k, d, range);
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