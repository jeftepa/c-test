import * as _ from 'underscore';
import { stochastic } from 'technicalindicators';
import { Strategies } from '../strategies/strategies';
import { UtilsService } from '../utils/utils.service';
import { StochasticOutput } from 'technicalindicators/declarations/momentum/Stochastic';

export class StochasticSegmentsStrategy implements Strategies.Strategy {
    public name = 'stochastic-segment';

    private isFirstAdvice = false;
    private previousAdvice: Strategies.advice = 'none';
    private previousParams: Strategies.IAnalysisData | undefined = undefined;

    constructor(private utilsService: UtilsService) {
    }

    public getTradeAdvice(params: Strategies.IAnalysisData): Strategies.advice {
        let advice: Strategies.advice;

        if (params.stochastic.k > params.stochastic.d && params.stochastic.k >= 20 && this.previousParams !== undefined && this.previousParams.stochastic.k <= 20) {
            advice = this.previousAdvice !== 'buy' ? 'buy' : 'none';
            // advice = 'buy';
            this.previousAdvice = 'buy';
        } else if (params.stochastic.k < params.stochastic.d && params.stochastic.k <= 80 && this.previousParams !== undefined && this.previousParams.stochastic.k >= 80) {
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

    public getParameters(): Strategies.IHashGraph<Strategies.IInputParams> {
        return {
            'stochastic': {
                'period':     
                {
                    name: 'period',
                    min: 1,
                    max: 20,
                    current: 1
                },
                'signalPeriod':
                {
                    name: 'signalPeriod',
                    min: 1,
                    max: 20,
                    current: 1
                }
            }
          };
    }

    public getParamKeys(): Strategies.IHashGraphParams<string[]> {
        return {
            'stochastic': [
                'period',
                'signalPeriod'
            ]
        };
    }

    public getAnalysisData(low: number[], high: number[], close: number[], parameters: Strategies.IHashGraph<Strategies.IInputParams>): Strategies.IAnalysisData[] {
        let stoch = stochastic({
            low: low,
            high: high,
            close: close,
            period: parameters['stochastic']['period'].current,
            signalPeriod: parameters['stochastic']['signalPeriod'].current
        });

        stoch = this.utilsService.fillArray<StochasticOutput>(stoch, low.length, { k: undefined, d: undefined });

        const data: Strategies.IAnalysisData[] = [];

        for (let i = 0; i < stoch.length; i++) {
            data.push(
                { stochastic: stoch[i] }
            );
        }

        return data;
    }

    public reset(): void {
        this.isFirstAdvice = false;
        this.previousAdvice = 'none';
        this.previousParams = undefined;
    }
}