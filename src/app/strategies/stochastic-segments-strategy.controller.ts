import * as _ from 'underscore';

export class StochasticSegmentsStrategy {
    private isFirstAdvice = false;
    private previousAdvice: Strategies.advice = 'none';
    private previousParams: Strategies.IGetTradeAdvice | undefined = undefined;

    constructor() {
    }

    public getTradeAdvice(params: Strategies.IGetTradeAdvice): Strategies.advice {
        let advice: Strategies.advice;

        if (params.k > params.d && params.k >= 20 && this.previousParams !== undefined && this.previousParams.k <= 20) {
            // advice = this.previousAdvice !== 'buy' ? 'buy' : 'none';
            advice = 'buy';
            this.previousAdvice = 'buy';
        } else if (params.k < params.d && params.k <=80 && this.previousParams !== undefined && this.previousParams.k >= 80) {
            // advice = this.previousAdvice !== 'sell' ? 'sell' : 'none';
            advice = 'sell';
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

    public getTradeAdviceBatch(params: Strategies.IGetTradeAdvice[]): Strategies.advice[] {
        const adviceBatch: Strategies.advice[] = [];

        _.each(params, (param) => {
            adviceBatch.push(this.getTradeAdvice(param));
        });

        return adviceBatch;
    }
}