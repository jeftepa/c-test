import { Injectable } from '@angular/core';
import * as Plotly from 'plotly.js';

@Injectable()
export class PlotsService {

  constructor() { }

  public plotStochChart(k: number[], d: number[], range: number[]): void {
    const kTrace = {
      x: range,
      y: k,
      type: <'scatter'>'scatter',
      name: 'k'
    };
    const dTrace = {
      x: range,
      y: d,
      type: <'scatter'>'scatter',
      name: 'd'
    };

    const stochData = [kTrace, dTrace];
    Plotly.newPlot('stoch-chart', stochData);
  }

  public plotCandleChart(low: number[], high: number[], close: number[], range: number[], buy?: number[], sell?: number[]): void {
    const buyTrace = {
      x: range,
      y: buy,
      mode: <'markers'>'markers',
      name: 'buy',
      marker: {
        color: 'rgb(75, 244, 66)',
        size: 10
      }
    };
    const sellTrace = {
      x: range,
      y: sell,
      mode: <'markers'>'markers',
      name: 'sell',
      marker: {
        color: 'rgb(247, 66, 42)',
        size: 10
      }
    };
    const lowTrace = {
      x: range,
      y: low,
      type: <'scatter'>'scatter',
      name: 'low',
      line: {
        color: 'rgb(219, 64, 82)',
        width: 1
      }
    };
    const highTrace = {
      x: range,
      y: high,
      type: <'scatter'>'scatter',
      name: 'high',
      line: {
        color: 'rgb(64, 219, 82)',
        width: 1
      }
    };
    const closeTrace = {
      x: range,
      y: close,
      type: <'scatter'>'scatter',
      name: 'close',
      line: {
        color: 'rgb(0, 0, 0)',
        width: 3
      }
    };

    const candleData = [lowTrace, highTrace, closeTrace, buyTrace, sellTrace];
    Plotly.newPlot('candle-chart', candleData);
  }
}
