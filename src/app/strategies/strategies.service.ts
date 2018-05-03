import { Injectable } from '@angular/core';
import { StochasticStrategy } from './stochastic-strategy.controller';
import { StochasticSegmentsStrategy } from './stochastic-segments-strategy.controller';

@Injectable()
export class StrategiesService {

  constructor() { }

  public getStochasticStrategy(): StochasticStrategy {
    return new StochasticStrategy;
  }

  public getStochasticSegmentsStrategy(): StochasticSegmentsStrategy {
    return new StochasticSegmentsStrategy;
  }

}
