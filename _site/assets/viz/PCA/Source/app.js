/* display eigen vectors and standardized data */

const projSelectElem = document.querySelector('#projSelect')
let showProjectedData = 1;
let projCompIndex = 0;

projSelectElem.onchange = function(){
  const currSelectedValue = this.options[this.selectedIndex].value * 1;
    showProjectedData = 1;

  if (currSelectedValue > 1){
    showProjectedData = 0;

    svgProjData.selectAll('circle').remove();

  }
  else projCompIndex = currSelectedValue;

  calcPCA();
}

// range2 of the plot
const range2 = {min: -5, max: 5};

const compViz = document.getElementById("componentViz");
// append the svg2 object to the body of the page
let svg2 = d3.select(compViz)
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    // .attr("width","100%")
    // .attr("height","100%")
    .on("click", click)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")")


// Add X axis
let x2 = d3.scaleLinear()
  .domain([range2.min, range2.max])
  .range([ 0, width ]);
svg2.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x2));


// Add Y axis
let y2 = d3.scaleLinear()
  .domain([range2.min, range2.max])
  .range([ height, 0]);
svg2.append("g")
  .call(d3.axisLeft(y2));

// converting the pixel coordinate back to the desired range2
let x2Inv = d3.scaleLinear()
  .domain([ 0, width ])
  .range([range2.min, range2.max]);

let y2Inv = d3.scaleLinear()
  .domain([ height, 0])
  .range([range2.min, range2.max]);


let gridIntervels2 = tf.linspace(range2.min+1, range2.max-1, 8).flatten().arraySync();

var lineGenerator2 = d3.line();

// vertical grid lines 
svg2.append('g')
  .selectAll('path')
  .data(gridIntervels2)
  .enter()
  .append('path')
  .attr( 'd', function(d) {return lineGenerator2([[x2(d),y2(range2.min)],[x2(d),y2(range2.max)]])} )
  .style('stroke', "gray")
  .attr('opacity', 0.5)

// vertical grid lines 
svg2.append('g')
  .selectAll('path')
  .data(gridIntervels2)
  .enter()
  .append('path')
  .attr( 'd', function(d) {return lineGenerator2([[x2(range2.min),y2(d)],[x2(range2.max),y2(d)]])} )
  .style('stroke', "gray")
  .attr('opacity', 0.5)


const originAxis2 = svg2.append('g').attr('class', 'originAxis')
// origin x2-axis

originAxis2
  .append('path')
  .attr( 'd', lineGenerator2([[x2(range2.min),y2(0)],[x2(range2.max),y2(0)]]) )
  .attr('stroke-width', 3)
  .attr('opacity', 0.7)
  .attr('stroke', darkModeCols.blue(1));

// origin y2-axis
originAxis2
  .append('path')
  .attr( 'd', lineGenerator2([[x2(0),y2(range2.min)],[x2(0),y2(range2.max)]]) )
  .attr('stroke-width', 3)
  .attr('opacity', 0.7)
  .attr('stroke','green');

// initializing PCA
const pca = new myPCA();

const svgEigVecs = svg2.append('g').attr('id', 'eigVecs');
const svgNormData = svg2.append('g').attr('id', 'normalizedData')
const svgProjData = svg2.append('g').attr('id', 'projectedData')

const cov = svg2.append('g')
.attr('id', 'covariance')


// update the visualization
function calcPCA(duration=500){

  console.log("button clicked")

  const dataPoints = [];

  // extract the data points svg2 object
  const pointsGroup =(document.getElementsByClassName('dataPoints')[0].childNodes);

  for(let i=0; i<pointsGroup.length;i++){
    const currPoint = [d3.select(pointsGroup[i]).attr('cx')*1, d3.select(pointsGroup[i]).attr('cy')*1]

    // converting these corrdinates back to the data range2
    currPoint[0] = x2Inv(currPoint[0]);
    currPoint[1] = y2Inv(currPoint[1]);

    dataPoints.push(currPoint)
  }


  console.log("dataPoints", tf.tensor(dataPoints).print())

  // Training PCA
  pca.fit(tf.tensor(dataPoints));

  const covEigenVectors = pca.model.covSVD[2];
  const covEigenVals = pca.model.covSVD[1];

  const eigVec0 = covEigenVectors.slice([0,0],[1,-1]).mul(pca.getExplainedVariance().slice([0,0],[1,1]).sqrt().mul(2)).expandDims(1).flatten().arraySync();
  const eigVec1 = covEigenVectors.slice([1,0],[1,-1]).mul(pca.getExplainedVariance().slice([1,1],[1,1]).sqrt().mul(2)).expandDims(1).flatten().arraySync();


  console.log('eig: ', eigVec0, eigVec1)

  const currSvgData = svgEigVecs.selectAll('path')
    .data([eigVec0, eigVec1]);

  // updating our eigenVecs
  currSvgData.enter()
    .append('path')
    .merge(currSvgData)
    .transition()
		.duration(duration)
    .attr('d', function(d){
      console.log(d);
      return lineGenerator2([ [x2(0),y2(0)], [x2(d[0]),y2(d[1])] ])}
      )
    .attr('stroke-width', 4)
    .attr('stroke','rgb(255, 46, 99)')
		.style('fill', function(d) {return d.fill;});

    const covData = [
      (pca.getExplainedVariance().slice([1,1],[1,1]).sqrt().mul(2).flatten().arraySync()[0]),
      (pca.getExplainedVariance().slice([0,0],[1,1]).sqrt().mul(2).flatten().arraySync()[0])
    ];




    // visualizing covariance
    cov.selectAll('ellipse')
    .data([covData, covData])
    .enter()
    .append('ellipse')
    .merge(cov.selectAll('ellipse'))
    .transition()
		.duration(duration)
    .attr('cx', x2(0))
    .attr('cy', y2(0))
    .attr('rx', function(d){ return  Math.abs(x2(0) - x2(d[0])) } )
    .attr('ry', function(d){ return  Math.abs(y2(0) - y2(d[1])) } )
    .attr('transform', 'rotate('+( Math.atan2(eigVec1[0], eigVec1[1])/(2*Math.PI)*360 + 90) +','+x2(0)+','+y2(0)+')')
    .attr('fill', function(d, i){ return (i===0)? 'teal': 'none'})
    .attr('opacity', function(d, i){return (i===0)? 0.2 : 1 })
    .attr('stroke-width', function(d,i){return (i==0)? 0 : 2.5})
    .attr('stroke-dasharray', "10 5")
    .attr('stroke', 'teal')



    // visualizing mean centered data
    const normalizedData = normalizeData(tf.tensor(dataPoints), 1).arraySync();

    const normalizedSvgData = svgNormData.selectAll('circle')
    .data(normalizedData)

    normalizedSvgData.enter()
    .append('circle')
    .merge(normalizedSvgData)
    .transition()
		.duration(duration)
    .attr('cx', function(d) { return x2(d[0])})
    .attr('cy', function(d) { return y2(d[1])})
    .attr('r', 5)
    .attr('opacity', 1)
    .attr('fill', darkModeCols.green(1))
    .attr('stroke-width', 2)


    if(showProjectedData){

      const noOfComponents = 1;
      let projectedData = pca.model.covSVD[0].slice([0,projCompIndex],[-1,noOfComponents])
            .matMul(pca.model.covSVD[1].slice([projCompIndex,projCompIndex],[noOfComponents, noOfComponents]))
            .matMul(pca.model.covSVD[2].slice([projCompIndex,0],[noOfComponents, -1]));

      projectedData = projectedData.arraySync()

      // visualizing the projection of data onto principal components.
      const projectedSvgData = svgProjData.selectAll('circle')
      .data(projectedData)

      projectedSvgData.enter()
      .append('circle')
      .merge(projectedSvgData)
      .transition()
      .duration(duration)
      .attr('cx', function(d) { return x2(d[0])})
      .attr('cy', function(d) { return y2(d[1])})
      .attr('r', 7)
      .attr('opacity', 1)
      .attr('fill', darkModeCols.red(1))
      .attr('stroke-width', 2)
    }



    // updating Math component visualizations:-

    // updating eigen vector matrix:-
    const eigVec1_0 = document.getElementById('matrix1_0');
    const eigVec1_1 = document.getElementById('matrix1_1');
    const eigVec2_0 = document.getElementById('matrix2_0');
    const eigVec2_1 = document.getElementById('matrix2_1');


    eigVec1_0.innerHTML = covEigenVectors.slice([0,0],[1,-1]).flatten().arraySync()[0].toFixed(2)
    eigVec1_1.innerHTML = covEigenVectors.slice([0,0],[1,-1]).flatten().arraySync()[1].toFixed(2)
    eigVec2_0.innerHTML = covEigenVectors.slice([1,0],[1,-1]).flatten().arraySync()[0].toFixed(2)
    eigVec2_1.innerHTML = covEigenVectors.slice([1,0],[1,-1]).flatten().arraySync()[1].toFixed(2)


    // updating eigen values:-

    const eigVal0 = document.getElementById('eigVal0');
    const eigVal1 = document.getElementById('eigVal1');

    eigVal0.innerHTML = covEigenVals.slice([0,0],[1,1]).flatten().arraySync()[0].toFixed(4);
    eigVal1.innerHTML = covEigenVals.slice([1,1],[1,1]).flatten().arraySync()[0].toFixed(4);

}