import { Injectable } from '@angular/core';
// import { StochasticStrategy } from './stochastic-strategy.controller';
import { StochasticSegmentsStrategy } from './stochastic-segments-strategy.controller';
import { Strategies } from '../strategies/strategies';
import { UtilsService } from '../utils/utils.service';
import { StochasticBollingerStrategy } from './stochastic-bollinger-strategy.controller';

@Injectable()
export class StrategiesService {

  constructor(private utilsService: UtilsService) { }

  public getStochasticStrategy(): Strategies.Strategy {
    return new StochasticSegmentsStrategy(this.utilsService); //StochasticStrategy;
  }

  public getStochasticSegmentsStrategy(): Strategies.Strategy {
    return new StochasticSegmentsStrategy(this.utilsService);
  }

  public getStochasticBollingerStrategy(): Strategies.Strategy {
    return new StochasticBollingerStrategy(this.utilsService);
  }

  public getStrategies(): string[] {
    return [
      'stochastic',
      'stochastic-segments',
      'stochastic-bollinger'
    ];
  }

  public getStrategy(name: string): Strategies.Strategy {
    if (name === 'stochastic') {
      return this.getStochasticStrategy();
    }

    if (name === 'stochastic-segments') {
      return this.getStochasticSegmentsStrategy();
    }

    if (name === 'stochastic-bollinger') {
      return this.getStochasticBollingerStrategy();
    }

    throw Error;
  }

}
