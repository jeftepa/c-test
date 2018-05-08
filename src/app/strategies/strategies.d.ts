declare module Strategies {
    export interface IAnalysisData {
        k?: number;
        d?: number;
    }

    export type advice = 'buy' | 'sell' | 'none';

    export interface IParams {
        name: string;
        current: number;
    }

    export interface ISimulationParams extends IParams {
        min: number;
        max: number;
    }
      
    export interface IHashGraph<T> {
        [key: string]: T;
    }

    export interface Strategy {
        name: string;
        getTradeAdvice(params: Strategies.IAnalysisData): Strategies.advice;
        getTradeAdviceBatch(params: Strategies.IAnalysisData[]): Strategies.advice[];
        getParameters():IHashGraph<ISimulationParams>;
        getParamKeys(): string[];
        getAnalysisData(low: number[], high: number[], close: number[], parameters: IHashGraph<ISimulationParams>): IAnalysisData[];
        reset();
    }
}
