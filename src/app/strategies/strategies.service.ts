import { Injectable } from '@angular/core';
import { StochasticStrategy } from './stochastic-strategy.controller';

@Injectable()
export class StrategiesService {

  constructor() { }

  public getStochasticStrategy(): StochasticStrategy {
    return new StochasticStrategy;
  }

}
