import { Component } from '@angular/core';
import { StrategiesService } from '../../strategies/strategies.service';
import Binance, { CandlesOptions, CandleChartInterval, Candle, CandleChartResult } from 'binance-api-node';
import * as _ from 'underscore';
import * as __ from 'lodash'
import { TradingService } from '../../trading/trading.service';
import { Strategies } from '../../strategies/strategies';


interface IMyCandle {
  low: string;
  high: string;
  close: string;
  buy?: number;
  sell?: number;
}

interface IBalance {
  balance1: number;
  balance2: number;
  totalBalance: number;
  params: Strategies.IHashGraph<Strategies.IInputParams>;
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
  private topBalance: IBalance = {
    balance1: 0,
    balance2: 0,
    totalBalance: 0,
    params: undefined
  }
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
  private _selectedStrategy = 'stochastic-bollinger';
  get selectedStrategy(): string {
    return this._selectedStrategy;
  }
  set selectedStrategy(input: string) {
    if (this._selectedStrategy !== input) {
      this._selectedStrategy = input;
      this.loadStrategy();
    }
  }

  public strategies: string[];
  public selectedInterval: CandleChartInterval = '1m';
  public intervals: string[] = ['1m', '3m', '5m', '15m', '30m', '1h' , '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
  public selectedLimit = 1000;
  public parameters: Strategies.IHashGraph<Strategies.IInputParams>;
  public stratKeys: string[];
  public paramKeys: Strategies.IHashGraphParams<string[]>;

  public simulationSummary = '';
  public simulationOutput = '';

  public isSimulationRunning = false;
  public cancelSimulation = false;

  constructor(private strategyService: StrategiesService,
              private tradingService: TradingService) {
    this.strategies = this.strategyService.getStrategies();
    this.loadStrategy();
  }

  public async ngOnInit(): Promise<void> {
    const exchangeInfo = await this.binance.exchangeInfo();
    this.symbols = _.pluck(exchangeInfo.symbols, 'symbol');
    this.filteredSymbols = this.symbols;
  }

  public async onRun(): Promise<void> {
    if (!_.contains(this.symbols, this.selectedSymbol)) {
      console.warn('Invalid symbol, please select a valid symbol.');
      return;
    }

    this.isSimulationRunning = true;

    this.reset();
    this.initSummaryTextField();
    await this.runSimulation(this.selectedInterval, this.selectedLimit);
    this.endSummaryTextField();

    this.isSimulationRunning = false;
  }

  public onCancelSimulation(): void {
    if (this.isSimulationRunning) {
      this.cancelSimulation = true;
    }
  }

  private wait(ms: number)  {
    return new Promise((resolve)=> {
      setTimeout(resolve, ms);
    });
  }
  
  private async runSimulation(interval: CandleChartInterval, limit: number): Promise<void> {
    this.candles = await this.binance.candles({ symbol: this._selectedSymbol, interval: interval, limit: limit });

    _.each(this.parameters, (strats) => {
      _.each(strats, (param) => {
        this.totalRuns *= (param.max - param.min + 1);
        param.current = param.min;
      })
    });

    while(this.run <= this.totalRuns && !this.cancelSimulation) {
      await this.wait(0);

      this.addSimulationOutput('run: ' + this.run, this.run === 1 ? 0 : 3);
      this.addSimulationOutput('** period **: ' + this.parameters['stochastic']['period'].current, 1);
      this.addSimulationOutput('** signalPeriod **: ' + this.parameters['stochastic']['signalPeriod'].current, 1);

      this.strategy.reset();
      this.runAnalysis();

      loop1:
      for (let i = this.stratKeys.length - 1; i > -1; i--) {
        const strat = this.stratKeys[i];
        const paramKeys = Object.keys(this.parameters[strat]); // strategy params

        for (let j = paramKeys.length - 1; j > -1; j--) {
          if (this.parameters[strat][paramKeys[j]].current < this.parameters[strat][paramKeys[j]].max) {
            this.parameters[strat][paramKeys[j]].current++;
            break loop1;
          } else {
            this.parameters[strat][paramKeys[j]].current = this.parameters[strat][paramKeys[j]].min;
          }
        } 
      }

      this.run++;
    }

    this.totalRuns = 1;
    this.run = 1;

    this.cancelSimulation = false;

    _.each(this.parameters, (strat) => {
      _.each(strat, (param) => {
        param.current = param.min;
      });
    })
  }

  private runAnalysis(): void {
    const high: number[] = _.pluck(this.candles, 'high');
    const low: number[] = _.pluck(this.candles, 'low');
    const close: number[] = _.pluck(this.candles, 'close');
    const range = _.range(low.length);

    const analysisData = this.strategy.getAnalysisData(low, high, close, this.parameters);

    const adviceBatch = this.strategy.getTradeAdviceBatch(analysisData);
    this.setAdvice(adviceBatch, close);

    this.tradingService.reset();
    this.tradingService.balance1 = 100;
    this.tradingService.doTradeBatch(adviceBatch, close);

    this.addSimulationOutput('balance 1: ' + this.tradingService.balance1, 2);
    this.addSimulationOutput('balance 2: ' + this.tradingService.balance2, 1);
    const totalBalance = (this.tradingService.balance1 + (this.tradingService.balance2 / close[close.length - 1]));
    this.addSimulationOutput('total balance: ' + totalBalance, 1);
    
    if (this.topBalance.totalBalance < totalBalance) {
      this.topBalance = {
        balance1: this.tradingService.balance1,
        balance2: this.tradingService.balance2,
        totalBalance: totalBalance,
        params: __.cloneDeep(this.parameters) 
      }
    }
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

  private reset(): void {
    this.simulationOutput = '';
    this.simulationSummary = '';
    this.topBalance = {
      balance1: 0,
      balance2: 0,
      totalBalance: 0,
      params: undefined
    }
  }

  private loadStrategy() {
    this.strategy = this.strategyService.getStrategy(this._selectedStrategy);
    this.parameters = this.strategy.getParameters();
    this.paramKeys = this.strategy.getParamKeys();
    this.stratKeys = Object.keys(this.paramKeys);
  }

  private initSummaryTextField(): void {
    this.addSimulationSummary('strategy: ' + this._selectedStrategy, 0);
    this.addSimulationSummary('interval: ' + this.selectedInterval, 1);
    this.addSimulationSummary('symbol: ' + this.selectedSymbol, 1);
    this.addSimulationSummary('limit: ' + this.selectedLimit, 1);

    this.addSimulationSummary('period: ' + this.parameters['stochastic']['period'].min + ' - ' + this.parameters['stochastic']['period'].max, 2);
    this.addSimulationSummary('signalPeriod: ' + this.parameters['stochastic']['signalPeriod'].min + ' - ' + this.parameters['stochastic']['signalPeriod'].max, 1);
  }

  private endSummaryTextField(): void {
    this.addSimulationSummary('Results =>', 3);
    this.addSimulationSummary('', 1);
    _.each(this.topBalance.params, (strat) => {
      _.each(strat, (param) => {
        this.addSimulationSummary(param.name + ': ' + param.current, 1);
      });
    });

    this.addSimulationSummary('balance1: ' + this.topBalance.balance1, 2);
    this.addSimulationSummary('balance2: ' + this.topBalance.balance2, 1);
    this.addSimulationSummary('totalBalance: ' + this.topBalance.totalBalance, 1);
  }
}
