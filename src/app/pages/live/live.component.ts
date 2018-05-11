import { Component } from '@angular/core';
import { StrategiesService } from '../../strategies/strategies.service';
import { stochastic } from 'technicalindicators';
import Binance, { CandlesOptions, CandleChartInterval, Candle, CandleChartResult } from 'binance-api-node';
import * as _ from 'underscore';
// import { StochasticStrategy } from '../../strategies/stochastic-strategy.controller';
import { PlotsService } from '../../plots/plots.service';
import { UtilsService } from '../../utils/utils.service';
import { Strategies } from '../../strategies/strategies';

interface IMyCandle {
  low: string;
  high: string;
  close: string;
  buy?: number;
  sell?: number;
}

@Component({
  selector: 'live',
  templateUrl: './live.component.html',
  styleUrls: ['./live.component.css']
})
export class LiveComponent {
  private strategy: Strategies.Strategy;
  private binance = Binance();
  private candles: IMyCandle[] = [];
  private webSocket: Function;

  public symbol = 'EOSETH';
  public period = 12;
  public signalPeriod = 5;
  public selectedStrategy = 'stochastic-segments';
  public strategies: string[];

  constructor(private strategyService: StrategiesService,
              private plotsService: PlotsService,
              private utilsService: UtilsService) {
    this.strategies = this.strategyService.getStrategies();
    this.strategy = this.strategyService.getStrategy(this.selectedStrategy);

    // const exchangeInfo = await this.binance.exchangeInfo();
    // exchangeInfo.symbols;
  }

  public async ngOnInit(): Promise<void> {
    this.strategy.reset();

    this.runLive();
  }

  public ngOnDestroy(): void {
    if (this.webSocket) {
      this.webSocket();
    }
  }

  public async onRefresh(): Promise<void> {
    if (this.selectedStrategy !== this.strategy.name) {
      this.strategy = this.strategyService.getStrategy(this.selectedStrategy);
    }

    this.strategy.reset();

    this.webSocket();
    this.runLive();
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

    const k = this.utilsService.fillArray<number>(_.pluck(stoch, 'k'), this.candles.length);
    const d = this.utilsService.fillArray<number>(_.pluck(stoch, 'd'), this.candles.length);

    const params: Strategies.IAnalysisData = {
      // k: k[k.length - 1],
      // D: d[d.length - 1]
    }

    const advice = this.strategy.getTradeAdvice(params);
    // console.log('i: ' + (k.length - 1));
    // console.log('k: ' + k[k.length - 1]);
    // console.log('d: ' + d[d.length -1]);
    // console.log('advice: ' + advice);

    this.candles[this.candles.length - 1].buy = advice === 'buy' ? close[this.candles.length - 1] : undefined;
    this.candles[this.candles.length - 1].sell = advice === 'sell' ? close[this.candles.length - 1] : undefined;

    const buy = this.utilsService.fillArray<number>(_.pluck(this.candles, 'buy'), this.candles.length);
    const sell = this.utilsService.fillArray<number>(_.pluck(this.candles, 'sell'), this.candles.length);

    this.plotsService.plotCandleChart(low, high, close, range, buy, sell);
    // this.plotsService.plotStochChart(k, d, range);
  }
}
