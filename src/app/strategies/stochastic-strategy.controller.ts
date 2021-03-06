// import * as _ from 'underscore';
// import { stochastic } from 'technicalindicators';
// import { Strategies } from '../strategies/strategies';

// export class StochasticStrategy implements Strategies.Strategy {
//     public name = 'stochastic';

//     private isFirstAdvice = false;
//     private previousAdvice: Strategies.advice = 'none';

//     constructor() {
//     }

//     public getTradeAdvice(params: Strategies.IAnalysisData): Strategies.advice {
//         let advice: Strategies.advice;

//         if (params.stochastic.k > params.stochastic.d) {
//             advice = this.previousAdvice !== 'buy' ? 'buy' : 'none';
//             this.previousAdvice = 'buy';
//         } else if (params.stochastic.k < params.stochastic.d) {
//             advice = this.previousAdvice !== 'sell' ? 'sell' : 'none';
//             this.previousAdvice = 'sell';
//         } else {
//             advice = 'none';
//         }
        
//         if (!this.isFirstAdvice) {
//             this.isFirstAdvice = true;
//             return 'none';
//         }

//         return advice;
//     }

//     public getTradeAdviceBatch(params: Strategies.IAnalysisData[]): Strategies.advice[] {
//         const adviceBatch: Strategies.advice[] = [];

//         _.each(params, (param) => {
//             adviceBatch.push(this.getTradeAdvice(param));
//         });

//         return adviceBatch;
//     }

//     public getParameters(): Strategies.IHashGraph<Strategies.IInputParams> {
//         return {
//             'period':     
//               {
//                 name: 'period',
//                 min: 1,
//                 max: 10,
//                 current: 1
//               },
//             'signalPeriod':
//               {
//                 name: 'signalPeriod',
//                 min: 1,
//                 max: 10,
//                 current: 1
//               }
//           };
//     }

//     public getParamKeys(): string[] {
//         return ['period', 'signalPeriod'];
//     }

//     public getAnalysisData(low: number[], high: number[], close: number[], parameters: Strategies.IHashGraph<Strategies.IInputParams>): Strategies.IAnalysisData[] {
//         return stochastic({
//             low: low,
//             high: high,
//             close: close,
//             period: parameters['period'].current,
//             signalPeriod: parameters['signalPeriod'].current
//         });
//     }

//     public reset(): void {
//         this.isFirstAdvice = false;
//         this.previousAdvice = 'none';
//     }
// }