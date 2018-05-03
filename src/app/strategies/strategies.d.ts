declare module Strategies {
    export interface IGetTradeAdvice {
        k?: number;
        d?: number;
    }

    export type advice = 'buy' | 'sell' | 'none';

    export interface Strategy {
        name: string;
        getTradeAdvice(params: Strategies.IGetTradeAdvice): Strategies.advice;
        getTradeAdviceBatch(params: Strategies.IGetTradeAdvice[]): Strategies.advice[];
        reset();
    }
}
