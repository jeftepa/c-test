type advice = 'buy' | 'sell' | 'none';

export class StochasticStrategy {
    private isFirstAdvice = false;
    private previousAdvice: advice = 'none';

    constructor() {
    }

    public getTradeAdvice(k: number, d: number): advice {
        let advice: advice;

        if (k > d) {
            advice = this.previousAdvice !== 'buy' ? 'buy' : 'none';
            this.previousAdvice = 'buy';
        } else if (k < d) {
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
}