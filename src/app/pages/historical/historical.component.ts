import { Component } from '@angular/core';
import { StrategiesService } from '../../strategies/strategies.service';
import { stochastic } from 'technicalindicators';
import Binance, { CandlesOptions, CandleChartInterval, Candle, CandleChartResult } from 'binance-api-node';
import * as _ from 'underscore';
import { StochasticStrategy } from '../../strategies/stochastic-strategy.controller';
import { PlotsService } from '../../plots/plots.service';
import { UtilsService } from '../../utils/utils.service';
import { TradingService } from '../../trading/trading.service';

interface IMyCandle {
  low: string;
  high: string;
  close: string;
  buy?: number;
  sell?: number;
}

@Component({
  selector: 'historical',
  templateUrl: './historical.component.html',
  styleUrls: ['./historical.component.css']
})
export class HistoricalComponent {
  private strategy: Strategies.Strategy;
  private binance = Binance();
  private candles: IMyCandle[] = [];
  private webSocket: Function;
  private symbols: string[];
  private _selectedSymbol = 'EOSETH';
  get selectedSymbol(): string {
    return this._selectedSymbol;
  }
  set selectedSymbol(input: string) {
    this._selectedSymbol = input.toUpperCase();

    this.filteredSymbols = _.filter(this.symbols, (symbol) => {
      return symbol.indexOf(this._selectedSymbol) > -1;
    });
  }

  public filteredSymbols: string[];
  public selectedStrategy = 'stochastic-segments';
  public strategies: string[];
  public selectedInterval: CandleChartInterval = '1m';
  public intervals: string[] = ['1m', '3m', '5m', '15m', '30m', '1h' , '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
  public selectedLimit = 300;
  public parameters: Strategies.IHashGraph<Strategies.ISimulationParams>;
  public paramKeys: string[];

  constructor(private strategyService: StrategiesService,
              private plotsService: PlotsService,
              private utilsService: UtilsService,
              private tradingService: TradingService) {
    this.strategies = this.strategyService.getStrategies();
    this.strategy = this.strategyService.getStrategy(this.selectedStrategy);
    this.parameters = this.strategy.getParameters();
    this.paramKeys = this.strategy.getParamKeys();
  }

  public async ngOnInit(): Promise<void> {
    const exchangeInfo = await this.binance.exchangeInfo();
    this.symbols = _.pluck(exchangeInfo.symbols, 'symbol');
    this.filteredSymbols = this.symbols;
  }

  public async onRefresh(): Promise<void> {
    if (!_.contains(this.symbols, this.selectedSymbol)) {
      console.warn('Invalid symbol, please select a valid symbol.');
      return;
    }

    if (this.selectedStrategy !== this.strategy.name) {
      this.strategy = this.strategyService.getStrategy(this.selectedStrategy);
    }

    this.strategy.reset();

    await this.runHistoricAnalysis(this.selectedSymbol, this.selectedInterval, this.selectedLimit);
  }
  
  private async runHistoricAnalysis(symbol: string, interval: CandleChartInterval, limit: number): Promise<void> {
    this.candles = await this.binance.candles({ symbol: symbol, interval: interval, limit: limit });
    const high: number[] = _.pluck(this.candles, 'high');
    const low: number[] = _.pluck(this.candles, 'low');
    const close: number[] = _.pluck(this.candles, 'close');
    const range = _.range(low.length);

    const analysisData = this.strategy.getAnalysisData(low, high, close, this.parameters);

    const adviceBatch = this.strategy.getTradeAdviceBatch(analysisData);
    this.setAdviceBatch(adviceBatch, close);

    const buy = this.utilsService.fillArray<number>(_.pluck(this.candles, 'buy'), this.candles.length);
    const sell = this.utilsService.fillArray<number>(_.pluck(this.candles, 'sell'), this.candles.length);

    this.tradingService.reset();
    this.tradingService.balance1 = 100;
    this.tradingService.doTradeBatch(adviceBatch, close);

    console.log('balance 1: ', this.tradingService.balance1);
    console.log('balance 2: ', this.tradingService.balance2);
    console.log('total balance: ', (this.tradingService.balance1 + (this.tradingService.balance2 / close[close.length - 1])));

    this.plotsService.plotCandleChart(low, high, close, range, buy, sell);
    this.plotsService.plotStochChart(analysisData, range);
  }

  private setAdviceBatch(adviceBatch: Strategies.advice[], close: number[]): void {
    _.each(adviceBatch, (advice, i) => {
      this.candles[i].buy = advice === 'buy' ? close[i] : undefined;
      this.candles[i].sell = advice === 'sell' ? close[i] : undefined;
    });
  }
}
