import { Component } from '@angular/core';
import { StrategiesService } from '../../strategies/strategies.service';
import { stochastic } from 'technicalindicators';
import Binance, { CandlesOptions, CandleChartInterval, Candle, CandleChartResult } from 'binance-api-node';
import * as _ from 'underscore';
import { StochasticStrategy } from '../../strategies/stochastic-strategy.controller';
import { PlotsService } from '../../plots/plots.service';
import { UtilsService } from '../../utils/utils.service';

interface IMyCandle {
  low: string;
  high: string;
  close: string;
  buy?: number;
  sell?: number;
}

@Component({
  selector: 'simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent {
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
  }

  public async ngOnInit(): Promise<void> {
    this.strategy.reset();

    await this.runHistoricAnalysis(this.symbol, '1m', 100);
  }

  public async onRefresh(): Promise<void> {
    if (this.selectedStrategy !== this.strategy.name) {
      this.strategy = this.strategyService.getStrategy(this.selectedStrategy);
    }

    this.strategy.reset();

    await this.runHistoricAnalysis(this.symbol, '1m', 100);
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

    const k = this.utilsService.fillArray<number>(_.pluck(stoch, 'k'), low.length);
    const d = this.utilsService.fillArray<number>(_.pluck(stoch, 'd'), low.length);

    const params: Strategies.IGetTradeAdvice[] = this.utilsService.unPluck([k, d], ['k', 'd']);
    const adviceBatch = this.strategy.getTradeAdviceBatch(params);
    this.setAdvice(adviceBatch, close);

    const buy = this.utilsService.fillArray<number>(_.pluck(this.candles, 'buy'), this.candles.length);
    const sell = this.utilsService.fillArray<number>(_.pluck(this.candles, 'sell'), this.candles.length);

    this.plotsService.plotCandleChart(low, high, close, range, buy, sell);
    this.plotsService.plotStochChart(k, d, range);
  }

  private setAdvice(adviceBatch: Strategies.advice[], close: number[]): void {
    _.each(adviceBatch, (advice, i) => {
      this.candles[i].buy = advice === 'buy' ? close[i] : undefined;
      this.candles[i].sell = advice === 'sell' ? close[i] : undefined;
    });
  }
}
