import * as _ from 'underscore';
import { stochastic } from 'technicalindicators';

export class StochasticSegmentsStrategy implements Strategies.Strategy {
    public name = 'stochastic-segment';

    private isFirstAdvice = false;
    private previousAdvice: Strategies.advice = 'none';
    private previousParams: Strategies.IAnalysisData | undefined = undefined;

    constructor() {
    }

    public getTradeAdvice(params: Strategies.IAnalysisData): Strategies.advice {
        let advice: Strategies.advice;

        if (params.k > params.d && params.k >= 20 && this.previousParams !== undefined && this.previousParams.k <= 20) {
            advice = this.previousAdvice !== 'buy' ? 'buy' : 'none';
            // advice = 'buy';
            this.previousAdvice = 'buy';
        } else if (params.k < params.d && params.k <= 80 && this.previousParams !== undefined && this.previousParams.k >= 80) {
            advice = this.previousAdvice !== 'sell' ? 'sell' : 'none';
            // advice = 'sell';
            this.previousAdvice = 'sell';
        } else {
            advice = 'none';
        }

        this.previousParams = params;
        
        if (!this.isFirstAdvice) {
            this.isFirstAdvice = true;
            return 'none';
        }

        return advice;
    }

    public getTradeAdviceBatch(params: Strategies.IAnalysisData[]): Strategies.advice[] {
        const adviceBatch: Strategies.advice[] = [];

        _.each(params, (param) => {
            adviceBatch.push(this.getTradeAdvice(param));
        });

        return adviceBatch;
    }

    public getParameters(): Strategies.IHashGraph<Strategies.ISimulationParams> {
        return {
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
    }

    public getParamKeys(): string[] {
        return ['period', 'signalPeriod'];
    }

    public getAnalysisData(low: number[], high: number[], close: number[], parameters: Strategies.IHashGraph<Strategies.ISimulationParams>): Strategies.IAnalysisData[] {
        return stochastic({
            low: low,
            high: high,
            close: close,
            period: parameters['period'].current,
            signalPeriod: parameters['signalPeriod'].current
        });
    }

    public reset(): void {
        this.isFirstAdvice = false;
        this.previousAdvice = 'none';
        this.previousParams = undefined;
    }
}