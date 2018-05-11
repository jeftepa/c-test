import { BollingerBandsOutput } from "technicalindicators/declarations/volatility/BollingerBands";
import { StochasticOutput } from "technicalindicators/declarations/momentum/Stochastic";

export declare module Strategies {
    export interface IAnalysisData {
        stochastic?: StochasticOutput,
        bollingerbands?: BollingerBandsOutput
    }

    export type advice = 'buy' | 'sell' | 'none';

    export interface IInputParams {
        name: string;
        current: number;
        min: number;
        max: number;
    }
      
    export interface IHashGraph<T> {
        [key: string]: IHashGraphParams<T>;
    }

    export interface IHashGraphParams<T> {
        [key: string]: T;
    }

    export interface Strategy {
        name: string;
        getTradeAdvice(params: Strategies.IAnalysisData): Strategies.advice;
        getTradeAdviceBatch(params: Strategies.IAnalysisData[]): Strategies.advice[];
        getParameters():IHashGraph<IInputParams>;
        getParamKeys(): IHashGraphParams<string[]>;
        getAnalysisData(low: number[], high: number[], close: number[], parameters: IHashGraph<IInputParams>): IAnalysisData[];
        reset();
    }
}
