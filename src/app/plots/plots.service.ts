import { Injectable } from '@angular/core';
import * as Plotly from 'plotly.js';
import { UtilsService } from '../utils/utils.service';
import * as _ from 'underscore';
import { Strategies } from '../strategies/strategies';
import { stochastic } from 'technicalindicators';
import { Plots } from './plots';

@Injectable()
export class PlotsService {

  constructor(private utilsService: UtilsService) { }

  public plotCandleChart(plotData: Plots.IPlotData): void {
    const buyTrace = {
      x: plotData.range,
      y: plotData.buy,
      mode: <'markers'>'markers',
      name: 'buy',
      marker: {
        color: 'rgb(75, 244, 66)',
        size: 10
      }
    };
    const sellTrace = {
      x: plotData.range,
      y: plotData.sell,
      mode: <'markers'>'markers',
      name: 'sell',
      marker: {
        color: 'rgb(247, 66, 42)',
        size: 10
      }
    };
    const lowTrace = {
      x: plotData.range,
      y: plotData.low,
      type: <'scatter'>'scatter',
      name: 'low',
      line: {
        color: 'rgb(219, 64, 82)',
        width: 1
      }
    };
    const highTrace = {
      x: plotData.range,
      y: plotData.high,
      type: <'scatter'>'scatter',
      name: 'high',
      line: {
        color: 'rgb(64, 219, 82)',
        width: 1
      }
    };
    const closeTrace = {
      x: plotData.range,
      y: plotData.close,
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

  public plotParamsChart(type: string, params: Strategies.IAnalysisData[], plotData: Plots.IPlotData) {
    if (type === 'stochastic') {
      this.plotStochChart(params, plotData.range);
    } else if (type === 'bollinger') {
      this.plotBollingerChart(params, plotData);
    }
  }

  private plotBollingerChart(params: Strategies.IAnalysisData[], plotData: Plots.IPlotData) {
    const lower = this.utilsService.fillArray<number>(_.map(params, (param) => { return param.bollingerbands.lower; }), plotData.range.length);
    const middle = this.utilsService.fillArray<number>(_.map(params, (param) => { return param.bollingerbands.middle; }), plotData.range.length);
    const upper = this.utilsService.fillArray<number>(_.map(params, (param) => { return param.bollingerbands.upper; }), plotData.range.length);
    const pb = this.utilsService.fillArray<number>(_.map(params, (param) => { return param.bollingerbands.pb; }), plotData.range.length);

    const lowerTrace = {
      x: plotData.range,
      y: lower,
      type: <'scatter'>'scatter',
      name: 'lower',
      line: {
        color: 'rgb(148, 0, 211)',
        width: 1
      },
      yaxis: 'y2'
    };
    const middleTrace = {
      x: plotData.range,
      y: middle,
      type: <'scatter'>'scatter',
      name: 'middle',
      line: {
        color: 'rgb(148, 0, 211)',
        width: 1
      },
      yaxis: 'y2'
    };
    const upperTrace = {
      x: plotData.range,
      y: upper,
      type: <'scatter'>'scatter',
      name: 'upper',
      line: {
        color: 'rgb(148, 0, 211)',
        width: 1
      },
      yaxis: 'y2'
    };
    const closeTrace = {
      x: plotData.range,
      y: plotData.close,
      type: <'scatter'>'scatter',
      name: 'close',
      line: {
        color: 'rgb(0, 0, 0)',
        width: 3
      },
      yaxis: 'y2'
    };

    const pbTrace = {
      x: plotData.range,
      y: pb,
      type: <'scatter'>'scatter',
      name: 'pb',
      yaxis: 'y1'
    };

    const layout = {
      yaxis: { domain: [0, 0.266] },
      xaxis2: { anchor: 'y2' },
      yaxis2: { domain: [0.366, 1] }
    };
    
    const candleData = [pbTrace, lowerTrace, middleTrace, upperTrace, closeTrace];
    Plotly.newPlot('bollinger-chart', candleData, layout);
  }

  private plotStochChart(params: Strategies.IAnalysisData[], range: number[]): void {
    const k = this.utilsService.fillArray<number>(_.map(params, (param) => { return param.stochastic.k; }), range.length);
    const d = this.utilsService.fillArray<number>(_.map(params, (param) => { return param.stochastic.d; }), range.length);

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
    Plotly.newPlot('stochastic-chart', stochData);
  }
}
