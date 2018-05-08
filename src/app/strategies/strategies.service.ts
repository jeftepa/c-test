import { Injectable } from '@angular/core';
import { StochasticStrategy } from './stochastic-strategy.controller';
import { StochasticSegmentsStrategy } from './stochastic-segments-strategy.controller';


@Injectable()
export class StrategiesService {

  constructor() { }

  public getStochasticStrategy(): Strategies.Strategy {
    return new StochasticStrategy;
  }

  public getStochasticSegmentsStrategy(): Strategies.Strategy {
    return new StochasticSegmentsStrategy;
  }

  public getStrategies(): string[] {
    return [
      'stochastic',
      'stochastic-segments'
    ];
  }

  public getStrategy(name: string): Strategies.Strategy {
    if (name === 'stochastic') {
      return this.getStochasticStrategy();
    }

    if (name === 'stochastic-segments') {
      return this.getStochasticSegmentsStrategy();
    }

    throw Error;
  }

}
