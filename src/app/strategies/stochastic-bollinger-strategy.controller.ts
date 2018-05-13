import * as _ from 'underscore';
import { stochastic, bollingerbands } from 'technicalindicators';
import { Strategies } from '../strategies/strategies';
import { UtilsService } from '../utils/utils.service';
import { StochasticOutput } from 'technicalindicators/declarations/momentum/Stochastic';
import { BollingerBandsOutput } from 'technicalindicators/declarations/volatility/BollingerBands';

export class StochasticBollingerStrategy implements Strategies.Strategy {
    public name = 'stochastic-bollinger';

    private isFirstAdvice = false;
    private previousAdvice: Strategies.advice = 'none';
    private previousParams: Strategies.IAnalysisData | undefined = undefined;

    constructor(private utilsService: UtilsService) {
    }

    public getTradeAdvice(params: Strategies.IAnalysisData): Strategies.advice {
        let advice: Strategies.advice;

        if (params.stochastic.k > params.stochastic.d && params.stochastic.k >= 20 && this.previousParams !== undefined && this.previousParams.stochastic.k <= 20
                && params.bollingerbands.pb <= 0.2) {
            advice = this.previousAdvice !== 'buy' ? 'buy' : 'none';
            // advice = 'buy';
            this.previousAdvice = 'buy';
        } else if (params.stochastic.k < params.stochastic.d && params.stochastic.k <= 80 && this.previousParams !== undefined && this.previousParams.stochastic.k >= 80
                && params.bollingerbands.pb >= 0.8) {
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
                    max: 15,
                    current: 1
                },
                'signalPeriod':
                {
                    name: 'signalPeriod',
                    min: 1,
                    max: 15,
                    current: 1
                }
            },
            'bollinger': {
                'stdDev':     
                {
                    name: 'stdDev',
                    min: 1,
                    max: 5,
                    current: 1
                },
                'period':
                {
                    name: 'period',
                    min: 1,
                    max: 15,
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
            ],
            'bollinger': [
                'stdDev',
                'period'
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

        let boll = bollingerbands({
            values: close,
            stdDev: parameters['bollinger']['stdDev'].current,
            period: parameters['bollinger']['period'].current
        })
        boll = this.utilsService.fillArray<BollingerBandsOutput>(boll, low.length, { middle: undefined, upper: undefined, lower: undefined, pb: undefined });

        const data: Strategies.IAnalysisData[] = [];

        for (let i = 0; i < stoch.length; i++) {
            data.push(
                { 
                    stochastic: stoch[i],
                    bollingerbands: boll[i]
                }
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