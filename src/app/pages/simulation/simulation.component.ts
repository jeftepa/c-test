import { Component } from '@angular/core';
import { StrategiesService } from '../../strategies/strategies.service';
import { stochastic } from 'technicalindicators';
import Binance, { CandlesOptions, CandleChartInterval, Candle, CandleChartResult } from 'binance-api-node';
import * as _ from 'underscore';
import { StochasticStrategy } from '../../strategies/stochastic-strategy.controller';
import { UtilsService } from '../../utils/utils.service';
import { TradingService } from '../../trading/trading.service';


interface IMyCandle {
  low: string;
  high: string;
  close: string;
  buy?: number;
  sell?: number;
}

interface ISimulationParams {
  name: string;
  min: number;
  max: number;
  current: number;
}

interface IHashGraph<T> {
  [key: string]: T;
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
  private totalRuns = 1;
  private run = 1;
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

  public simulationSummary = '';
  public simulationOutput = '';

  public parameters: IHashGraph<ISimulationParams> = {
    'period':     
      {
        name: 'period',
        min: 1,
        max: 10,
        current: 1
      },
    'signalPeriod':
      {
        name: 'signalPeriod',
        min: 1,
        max: 10,
        current: 1
      }
  };
  public paramKeys: string[] = ['period', 'signalPeriod'];

  constructor(private strategyService: StrategiesService,
              private utilsService: UtilsService,
              private tradingService: TradingService) {
    this.strategies = this.strategyService.getStrategies();
    this.strategy = this.strategyService.getStrategy(this.selectedStrategy);
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

    this.resetTextFields();

    this.addSimulationSummary('strategy: ' + this.selectedStrategy, 0);
    this.addSimulationSummary('interval: ' + this.selectedInterval, 1);
    this.addSimulationSummary('symbol: ' + this.selectedSymbol, 1);

    this.addSimulationSummary('period: ' + this.parameters['period'].min + ' - ' + this.parameters['period'].max, 2);
    this.addSimulationSummary('signalPeriod: ' + this.parameters['signalPeriod'].min + ' - ' + this.parameters['signalPeriod'].max, 1);

    await this.runSimulation(this.selectedInterval, 100);

    this.addSimulationSummary('Results =>', 2);
  }
  
  private async runSimulation(interval: CandleChartInterval, limit: number): Promise<void> {
    this.candles = await this.binance.candles({ symbol: this._selectedSymbol, interval: interval, limit: limit });
    const paramKeys = Object.keys(this.parameters);

    _.each(this.parameters, (param) => {
      this.totalRuns *= (param.max - param.min + 1);
    });

    while(this.run <= this.totalRuns) {
      this.addSimulationOutput('run: ' + this.run, this.run === 1 ? 0 : 3);
      this.addSimulationOutput('** period **: ' + this.parameters['period'].current, 1);
      this.addSimulationOutput('** signalPeriod **: ' + this.parameters['signalPeriod'].current, 1);

      this.strategy.reset();
      this.runAnalysis();

      for(let i = paramKeys.length - 1; i > -1; i--) {
        if (this.parameters[paramKeys[i]].current < this.parameters[paramKeys[i]].max) {
          this.parameters[paramKeys[i]].current++;
          break;
        } else {
          this.parameters[paramKeys[i]].current = this.parameters[paramKeys[i]].min;
        }
      }

      this.run++;
    }

    this.totalRuns = 1;
    this.run = 1;

    _.each(this.parameters, (param) => {
      param.current = param.min;
    })
  }

  private runAnalysis(): void {
    const high: number[] = _.pluck(this.candles, 'high');
    const low: number[] = _.pluck(this.candles, 'low');
    const close: number[] = _.pluck(this.candles, 'close');
    const range = _.range(low.length);

    const stoch = stochastic({
      low: low,
      high: high,
      close: close,
      period: this.parameters['period'].current,
      signalPeriod: this.parameters['signalPeriod'].current
    });

    const k = this.utilsService.fillArray<number>(_.pluck(stoch, 'k'), low.length);
    const d = this.utilsService.fillArray<number>(_.pluck(stoch, 'd'), low.length);

    const params: Strategies.IGetTradeAdvice[] = this.utilsService.unPluck([k, d], ['k', 'd']);
    const adviceBatch = this.strategy.getTradeAdviceBatch(params);
    this.setAdvice(adviceBatch, close);

    this.tradingService.reset();
    this.tradingService.balance1 = 100;
    this.tradingService.doTradeBatch(adviceBatch, close);

    this.addSimulationOutput('balance 1: ' + this.tradingService.balance1, 2);
    this.addSimulationOutput('balance 2: ' + this.tradingService.balance2, 1);
    this.addSimulationOutput('total balance: ' + (this.tradingService.balance1 + (this.tradingService.balance2 / close[close.length - 1])), 1);
  }

  private setAdvice(adviceBatch: Strategies.advice[], close: number[]): void {
    _.each(adviceBatch, (advice, i) => {
      this.candles[i].buy = advice === 'buy' ? close[i] : undefined;
      this.candles[i].sell = advice === 'sell' ? close[i] : undefined;
    });
  }

  private addSimulationOutput(output: string, numberOfLineEndings: number): void {
    while (numberOfLineEndings > 0) {
      this.simulationOutput = this.simulationOutput.concat('<br>');
      numberOfLineEndings--;
    }
    this.simulationOutput = this.simulationOutput.concat(output);
  }

  private addSimulationSummary(output: string, numberOfLineEndings: number): void {
    while (numberOfLineEndings > 0) {
      this.simulationSummary = this.simulationSummary.concat('<br>');
      numberOfLineEndings--;
    }
    this.simulationSummary = this.simulationSummary.concat(output);
  }

  private resetTextFields(): void {
    this.simulationOutput = '';
    this.simulationSummary = '';
  }
}
