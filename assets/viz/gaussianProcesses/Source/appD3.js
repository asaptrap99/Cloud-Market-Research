// const divContainer = document.getElementById('viz');
const degree = 8;
const maxDegree = 10;
const myVariance = 0.2;

const basisParams = {
  name: 'rbf',
  fnParams: {
    centreRange: { min: -5, max: 5, division: 30 },
    variance: myVariance,
  },
};

/**
 * function for a click event
 */
function click() {
  // Ignore the click event if it was suppressed
  // if (d3.event.defaultPrevented) return;

  // Extract the click location\
  const point = d3.mouse(this);
  const p = { x: point[0], y: point[1] };

  console.log('yes');

  // Append a new point to our data Points group
  svg
    .select('.dataPoints')
    .append('circle')
    .attr('cx', p.x - margin.left)
    .attr('cy', p.y - margin.top)
    .attr('r', '7')
    .style('fill', darkModeCols.blue(1.0))
    .call(drag);
}

// Define drag beavior
const drag = d3.drag().on('drag', dragmove);

/**
 * drag the data point
 */
function dragmove() {
  const x = d3.event.x;
  const y = d3.event.y;
  d3.select(this).attr('cx', x).attr('cy', y);
}

console.log("yes")
// input viz
const inputVizObj = new inputViz(
  '#viz',
  {
    width: 1000,
    height: 500,
    gridIntervel: { x: 16, y: 8 },
    rangeX: { min: -5, max: 5 },
    rangeY: { min: -2, max: 2 },
    isGrid: true,
  },
  (eventHandlers = { onClick: click })
);


const svg = inputVizObj.getComponents().svg;
svg.style('color', 'white');
const margin = inputVizObj.getComponents().svgSettings.margin;

// creating the background rect
inputVizObj
  .getComponents()
  .spaces.beforeGridSpace.append('rect')
  .attr('width', inputVizObj.getComponents().svgSettings.width)
  .attr('height', inputVizObj.getComponents().svgSettings.width)
  // .style('fill', 'black');

const afterGridSpace = inputVizObj.getComponents().spaces.afterGridSpace;

// create group for data points
const dataPointsGrp = svg.append('g').attr('class', 'dataPoints');

// creating groups for predicted Y
const predYGrp = afterGridSpace.append('g').attr('id', 'predictedY');
const predYStdev = afterGridSpace.append('g').attr('id', 'predYStdev');
const predYMean = afterGridSpace.append('g').attr('id', 'predYMean');

// fetching important info from inputVizObj
const xScale = inputVizObj.getComponents().conversionFns.x;
const yScale = inputVizObj.getComponents().conversionFns.y;

const xInvScale = inputVizObj.getComponents().conversionFns.xInv;
const yInvScale = inputVizObj.getComponents().conversionFns.yInv;

/**
 * Updating the visualization
 */
function updateViz() {
  let dataX = [];
  let dataY = [];

  const dataPts = document.querySelector('.dataPoints').childNodes;

  for (let i = 0; i < dataPts.length; i++) {
    dataX.push(xInvScale(dataPts[i].attributes.cx.value));
    dataY.push(yInvScale(dataPts[i].attributes.cy.value));
  }

  // sort
  [dataX, dataY] = sortAB(dataX, dataY);

  console.log(dataX,dataY)

  const nSamples = dataPts.length;
  const trainX = tf.tensor(dataX).expandDims().transpose();
  const trainY = tf.tensor(dataY).expandDims().transpose();

  trainX.print();
  trainY.print();

  const ntestSamples = 100;

  const testX = tf.linspace(-5.3, 5.3, ntestSamples).expandDims(1);
  // // testX = trainX;
  const testY = tf.sin(testX.mul(tf.scalar(2 * Math.PI))); // sin(2*pi*x)
  // // testY = trainY;

  // /* parameters for visualization */
  // const dSize = nSamples; // no. of samples we use to calculate our curve.

  // let alpha = Math.random() * 5 - 2.5 + 0 * 5e-3;
  // let beta = Math.random() * 5 - 2.5 + 0 * 11.1;

  // alpha = 0.1;
  // beta = 0.1;

  // const lbf = LBF(trainX,trainY,testX,testY).useBasisFn("polynomial",{degree});
  // const lbf = LBF(trainX,trainY,testX,testY).useBasisFn("rbf", {centreRange: {min: -5, max: 5, division: 30}, variance: myVariance});
  // const lbf = LBF(trainX, trainY, testX, testY).useBasisFn(
  //   basisParams.name,
  //   basisParams.fnParams
  // );
  // // const {beta: newBeta,alpha: newAlpha} = lbf.evidenceMaximization(trainX,trainY,alpha,beta,true);
  // const { beta: newBeta, alpha: newAlpha } = lbf.gd(
  //   trainX,
  //   trainY,
  //   alpha,
  //   beta,
  //   true
  // );
  // alpha = newAlpha;
  // beta = newBeta;

  // const { y: predY, yVariance: predYVar } = lbf.train(alpha, beta).test(testX);

  // const predYArray = predY.flatten().arraySync();
  // const predYVarArray = predYVar.flatten().arraySync();

  // console.log(predY.print(), yVariance.print());


  const model = new gaussianProcess;

  const predY = model.test(testX, data={x: trainX, y: trainY});

  const predYArray = predY[0];

  /* Displaying Stdev:- */
  const stdevP1 = predY[1];
  const stdevM1 = predY[2];

  /* Displaying training data */

  // TODO: Make sure all the arrays that are going inside display are sorted accordingly.

  updatePlot(testX.flatten().arraySync(), predYArray, stdevP1, stdevM1);
}

/**
 *
 * @param {Array} x
 * @param {Array} meanY
 * @param {Array} stdevP
 * @param {Array} stdevN
 */
function updatePlot(x, meanY, stdevP, stdevN) {
  console.log('Updating Viz');

  // const data = {x: x, y : meanY, CI_Up: stdevP, CI_Down: stdevN };

  const data = Array(x.length);

  for (let i = 0; i < data.length; i++)
    data[i] = { x: x[i], y: meanY[i], CI_Up: stdevP[i], CI_Down: stdevN[i] };

  const predYGrpCISelect = predYStdev.selectAll('path');

  // Show confidence interval
  predYGrpCISelect
    .data([data])
    .enter()
    .append('path')
    .merge(predYGrpCISelect)
    .attr('fill', darkModeCols.magenta(0.2))
    .attr('stroke', 'tomato')
    .attr('stroke-width', '3px')
    .attr('stroke-dasharray', '10 15')
    .transition(d3.easeCubic)
    .duration(1000)
    .attr(
      'd',
      d3
        .area()
        .x(function (d) {
          return xScale(d.x);
        })
        .y0(function (d, i) {
          return yScale(d.CI_Up);
        })
        .y1(function (d, i) {
          return yScale(d.CI_Down);
        })
        .curve(d3.curveCardinal)
    );

  const predYGrpMeanPathSelect = predYMean.selectAll('path');

  // Show predictedY
  predYGrpMeanPathSelect
    .data([data])
    .enter()
    .append('path')
    .merge(predYGrpMeanPathSelect)
    .transition(d3.easeCubic)
    .duration(1000)
    .attr(
      'd',
      d3
        .line()
        .x(function (d) {
          console.log('skldjf');
          return xScale(d.x);
        })
        .y(function (d) {
          return yScale(d.y);
        })
        .curve(d3.curveCardinal)
    )
    .attr('fill', 'none')
    .attr('stroke', darkModeCols.grey(1.0))
    .attr('stroke-width', 2.5);
}

// const degreeSlider = document.getElementById("newDegree");
// const degreeOutput = document.getElementById("degreeTxt");

// const reCalcBtn = document.getElementById("reCalculate-btn");

// degreeSlider.oninput = function(){

//     degree =  Math.floor((this.value/100)*(maxDegree-1))+1;
//     // newDegree = 7;
//     degreeOutput.innerHTML = degree;

// }

// function reCalculate(){

//     updateViz();

//     console.log("Finished Recalculating.")

// }
