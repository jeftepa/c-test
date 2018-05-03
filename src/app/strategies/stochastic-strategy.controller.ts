import * as _ from 'underscore';

export class StochasticStrategy implements Strategies.Strategy {
    public name = 'stochastic';

    private isFirstAdvice = false;
    private previousAdvice: Strategies.advice = 'none';

    constructor() {
    }

    public getTradeAdvice(params: Strategies.IGetTradeAdvice): Strategies.advice {
        let advice: Strategies.advice;

        if (params.k > params.d) {
            advice = this.previousAdvice !== 'buy' ? 'buy' : 'none';
            this.previousAdvice = 'buy';
        } else if (params.k < params.d) {
            advice = this.previousAdvice !== 'sell' ? 'sell' : 'none';
            this.previousAdvice = 'sell';
        } else {
            advice = 'none';
        }
        
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

    public reset(): void {
        this.isFirstAdvice = false;
        this.previousAdvice = 'none';
    }
}