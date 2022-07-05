
let mySVM = 1;

let isFirst = 0;
let currClass = 0;

let useSaved = 0;

let canUpdate = 1;

const polyDegreeElem = document.getElementById('polyDegree');
const polyDegreeValElem = document.getElementById('degreeVal');
const rbfSigmaElem = document.getElementById('rbfSigma');
const rbfSigmaValElem = document.getElementById('sigmaVal');
const regElem = document.getElementById('regularization');
const regValElem = document.getElementById('regVal');
const changeClassElem = document.getElementById('changeClass');

let kernelType = 'linear';

function click(){
  // Ignore the click event if it was suppressed
  // if (d3.event.defaultPrevented) return;

  // Extract the click location\    
  var point = d3.mouse(this)
  , p = {x: point[0], y: point[1] };

    console.log('yes')

    const margin = inputVizObj.getComponents().svgSettings.margin;
    const svg = inputVizObj.getComponents().svg;

  // Append a new point to our data Points group
  svg.select((currClass)? '.dataPoints1' : '.dataPoints0')
        .append('circle')
        .attr('cx', (p.x -margin.left))
        .attr('cy', (p.y -margin.top))
          .attr('r', '7')
          .style('fill',(currClass)? "rgb(200,0,0)" : "blue")
          .call(drag)

  if(isFirst){
    updateViz();
  }
  else{

    // if (currClass)
    isFirst =1;
  }
}


// Define drag beavior
var drag = d3.drag()
    .on("drag", dragmove);

function dragmove(d) {
      if (canUpdate){
        var x = d3.event.x;
        var y = d3.event.y;
        d3.select(this)
            .attr('cx', (x))
            .attr('cy', (y))


        let updatePromise = updateViz();

        // console.log(updatePromise);
        canUpdate = 0;
        updatePromise.then((a) =>{
          console.log('from UpdatePromise', a);
        })
      }
      else{
        console.log('still Updating!!!!')
      }
}

// TODO: Fix the on Click event mechanism here as well as in the inputViz function in utils.js
// creating inputViz 
const inputVizObj = new inputViz('#inputSpace',{isGrid: false, isAxisLine: false}, eventHandlers={onClick: click});

// const svg = inputVizObj.getComponents().svg;
const svg = inputVizObj.getComponents().spaces.afterGridSpace;

const chartDecorGroup = svg.append('g').attr('class', 'chartDecor');
const chartDataGroup  = svg.append('g').attr('class', 'chartData');



/* adding a data Point group of class 0 in our svg container */
inputVizObj.getComponents().svg.append('g')
  .attr('class', 'dataPoints0')

/* adding a data Point group of class 1 in our svg container */
inputVizObj.getComponents().svg.append('g')
  .attr('class', 'dataPoints1')

/* adding a group to show weather a point is a support vector or not */
const chartSVGroup = svg.append('g')
  .attr('class', 'supportVectors')





const xRange0 = {min: -10, max: 10 };
const xRange1 = {min: -10, max: 10 };


const svgElemSize = 500;

const margin = inputVizObj.getComponents().svgSettings.margin;

// creating chart position properties:-

const innerHeight = inputVizObj.getComponents().svgSettings.width;
const innerWidth = inputVizObj.getComponents().svgSettings.height;

let dataPoints = chartDataGroup.append('g').attr('class', 'dataPoints');
let heatmap = chartDataGroup.append('g').attr('class', 'heatMap');
let contourMap = chartDataGroup.append('g').attr('class', 'contourMap');
let linearDB = chartDataGroup.append('g').attr('class', 'linearDB');

// group selection
let svSelect = chartSVGroup
.selectAll('circle');

let pathSelect = contourMap.selectAll('path');

let hyperplanePathSelect = linearDB.selectAll('path');

const xScale = inputVizObj.getComponents().conversionFns.x;
const yScale = inputVizObj.getComponents().conversionFns.y;

heatmap
.append('rect')
.attr('fill', 
    darkModeCols.blue(1.0)
    )
.attr('width', innerWidth)
.attr('height', innerHeight)

const axisGroup = chartDecorGroup.append('g').attr('class', 'axis');




function updateVisuals(model){


    let calcWeights = 0;
    let calcBias = 0;
    let calcAlphas = 0;
    let calcDataX = 0; // all the data points that are support vectors

    if (mySVM){
      calcWeights = model.getParams().weights;
      calcBias    = model.getParams().bias;
      calcAlphas = model.getAlphas().flatten().arraySync();
      calcDataX = model.getData().x.arraySync();

    }else{

      calcWeights = tf.tensor( model.getWeights().w ).expandDims();
      calcBias = tf.tensor( model.getWeights().b ).reshape([1,1]);
      calcAlphas = tf.tensor( model.alpha ).expandDims().transpose();
    }


let hyperplaneViz = calcHyperplane(model, {
  weights: calcWeights,
  bias: calcBias,
  range: [
  
    xRange0,
    xRange1
  ],

})

// visualizing support Vectors
svSelect = chartSVGroup
.selectAll('circle');

// svSelect.remove();

svSelect
.data(calcDataX).enter()
.append('circle')
.merge(svSelect)
        .attr('cx',(d, _) => xScale(d[0]) )
        .attr('cy',(d, _) => yScale(d[1]) )
        .attr('stroke', (_,i) => {return (calcAlphas[i] > 0)? 'black' : 'none' } )
  .attr('stroke-dasharray', (d,i) =>  "10 5")
  .attr("stroke-linejoin", "round")
        .attr('fill', 'none')
        .attr('stroke-width', 3)
          .attr('r', '12')



  /* plotting contour Map */
  pathSelect = contourMap.selectAll('path');

  if(kernelType == 'linear'){

    // remove the contour plot of other kernels
    pathSelect
    .remove();

  }else{

    // compute the density data
    var densityData = d3.contourDensity()
    .x(function(d) { return xScale(d[0]); })   // x and y = column name in .csv input data
    .y(function(d) { return yScale(d[1]); })
    .size([innerWidth, innerHeight])
    .thresholds(5)
    .bandwidth(20)    // smaller = more precision in lines = more lines
    (tf.tensor(hyperplaneViz.heatMap.x).concat(tf.tensor(hyperplaneViz.heatMap.y).expandDims().transpose(), 1).arraySync() .filter((d)=> { return (d[2] > 0)} ) )
    // Add the contour: several "path"


    pathSelect
    .data(densityData).enter()
    .append("path")
    .merge(pathSelect)
      .attr("d", d3.geoPath())
      .attr("fill", (d,i) => { if(i === 1)return darkModeCols.red(1.0); return "none"})
      .attr("stroke-width", 3)
      .attr("stroke", (d,i)=>{ 
        if(i <= 2) return "black"
      } )
      .attr('stroke-dasharray', (d,i) => {if(i != 1)return "10 7"})
      .attr("stroke-linejoin", "round")

  }

// adding hyperplane path
 hyperplanePathSelect = linearDB.selectAll('path');
const lineGen = d3.line();

if(kernelType === 'linear'){

  // plotting a hyperplane
  const hypNormalLinePath = lineGen(hyperplaneViz.hypNormal.map(d =>  [xScale(d.x), yScale(d.y)]) ); 
  const hyperplaneLinePath = lineGen(hyperplaneViz.hyperplane.map(d =>  [xScale(d.x), yScale(d.y)]) );
  const marginLeftLinePath = lineGen(hyperplaneViz.marginLeft.map(d => [xScale(d.x), yScale(d.y)] ));
  const marginRightLinePath = lineGen(hyperplaneViz.marginRight.map(d => [xScale(d.x), yScale(d.y)] ));

  const linearContourPlot = lineGen(hyperplaneViz.contourPlot.map(d => [xScale(d.x), yScale(d.y)] ))
  // const linearContourPlot = lineGen(hyperplaneViz.hyperplane.concat([{x: 10, y: -10}, {x: 10, y: 10}]).map(d => [xScale(d.x), yScale(d.y)] ));



  // visualizing left and right margin
  hyperplanePathSelect
  .data([linearContourPlot, hyperplaneLinePath, marginLeftLinePath, marginRightLinePath]).enter()
  .append("path")
  .merge(hyperplanePathSelect)
    .attr('d', (d)=> d)
    .attr('stroke', 'black')
    .attr('stroke-width', 3)
    .attr('stroke-dasharray', (d,i) => {if(i != 1 && i != 0)return "10 7"})
    .attr("stroke-linejoin", "round")
    .attr('fill', (_,i)=>{ return (i === 0)? darkModeCols.red(1.0) : 'none'});





  }else{
    hyperplanePathSelect.remove();
  }

};


// after finishing the calculation allow updating...
function onFinish(){

  canUpdate = 1;

  updateVisuals(model)
}



























let model = new svm(); 

/**
 *  here, we will update our classification visualizer
 */
async function updateViz(useSaved=false){

    if (!mySVM){
      model = new svmjs.SVM(); 
    }

svSelect = chartSVGroup
.selectAll('circle');

svSelect.remove();


// hyperplanePathSelect = linearDB.selectAll('path');
// hyperplanePathSelect.remove();

  const dataPoints0 = [];
  const dataPoints1 = [];

  // extract the data points svg object
  const pointsGroup0 = d3.selectAll('.dataPoints0')._groups[0][0].childNodes;
  const pointsGroup1 = d3.selectAll('.dataPoints1')._groups[0][0].childNodes;

  for(let i=0; i<pointsGroup0.length;i++){
    const currPoint = [d3.select(pointsGroup0[i]).attr('cx')*1, d3.select(pointsGroup0[i]).attr('cy')*1]

    // converting these corrdinates back to the data range2
    currPoint[0] = inputVizObj.getComponents().conversionFns.xInv(currPoint[0]);
    currPoint[1] = inputVizObj.getComponents().conversionFns.yInv(currPoint[1]);

    dataPoints0.push(currPoint)
  }

  for(let i=0; i<pointsGroup1.length;i++){
    const currPoint = [d3.select(pointsGroup1[i]).attr('cx')*1, d3.select(pointsGroup1[i]).attr('cy')*1]

    // converting these corrdinates back to the data range
    currPoint[0] = inputVizObj.getComponents().conversionFns.xInv(currPoint[0]);
    currPoint[1] = inputVizObj.getComponents().conversionFns.yInv(currPoint[1]);

    dataPoints1.push(currPoint)
  }
  const dataPoints0_y = new Array(pointsGroup0.length).fill([-1]);
  const dataPoints1_y = new Array(pointsGroup1.length).fill([+1]);

  let data = dataPoints0.concat(dataPoints1);

  let trainData = {x: tf.tensor(data), 
                   y: tf.tensor(dataPoints0_y).concat(tf.tensor(dataPoints1_y), 0)}

    const kernelParams = {'linear': {}, 
                          'poly': {degree: polyDegreeElem.value*1}, 
                          'rbf': {sigma: rbfSigmaElem.value*1}};


    // stop the ability to update untill the calculation finishes..
    canUpdate = 0;

    model.fit(trainData, 
      params = {threshold: .01, 
                tollerance:  regElem.value*1, 
                epoch: 100,
                // stepTime: 1000,
                useSaved: 0, 
                kernelType: kernelType, 
                kernelParams: kernelParams[kernelType],
                // verbose: true, 
                onFinishCallback:onFinish, 
                onEpochCallback: updateVisuals
              })

}


function changeClass(){
    currClass = 1-currClass;
}


const polyOptions = document.getElementById('polyOptions');
const rbfOptions = document.getElementById('rbfOptions');
function showPolyOptions(){
 polyOptions.style.display = ''; 
 rbfOptions.style.display = 'none'; 

  /* removing all the paths */
  svSelect.remove();
  /* plotting contour Map */
  // let pathSelect = contourMap.selectAll('path');
  // remove the contour plot of other kernels
  pathSelect
  .remove();

 kernelType = 'poly';
}

function showRbfOptions(){
 rbfOptions.style.display = ''; 
 polyOptions.style.display = 'none'; 

  /* removing all the paths */
  svSelect.remove();
  /* plotting contour Map */
  // let pathSelect = contourMap.selectAll('path');
  // remove the contour plot of other kernels
  pathSelect
  .remove();

 kernelType = 'rbf';
}

function showLinearOptions(){
  rbfOptions.style.display  = 'none'; 
  polyOptions.style.display = 'none'; 

  /* removing all the paths */
  svSelect.remove();
  /* plotting contour Map */
  // let pathSelect = contourMap.selectAll('path');
  // remove the contour plot of other kernels
  pathSelect
  .remove();

  kernelType = 'linear';



}


// this function is called everytime you press recalculate or change the params.
function update(){

  if (canUpdate){
    updateViz();
  }
  else[
    console.log('still updating...')
  ]
}

regElem.oninput = function(){
  regValElem.innerHTML = regElem.value;

  updateViz();
}

rbfSigmaElem.oninput = function(){
  rbfSigmaValElem.innerHTML = rbfSigmaElem.value;

  updateViz();
}

polyDegreeElem.oninput = function(){
  polyDegreeValElem.innerHTML = polyDegreeElem.value;

  updateViz();
}

changeClassElem.oninput = function(){

  changeClass();

}


document.addEventListener('keypress', (e) =>{if(e.keyCode === 99)changeClass();changeClassElem.checked = 1-changeClassElem.checked;})