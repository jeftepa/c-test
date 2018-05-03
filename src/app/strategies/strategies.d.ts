declare module Strategies {
    export interface IGetTradeAdvice {
        k?: number;
        d?: number;
    }

    export type advice = 'buy' | 'sell' | 'none';

    export interface StochasticSegmentsStrategy {

    }

    export interface Strategy {
        getTradeAdvice(params: Strategies.IGetTradeAdvice): Strategies.advice;
        getTradeAdviceBatch(params: Strategies.IGetTradeAdvice[]): Strategies.advice[];
    }
}
