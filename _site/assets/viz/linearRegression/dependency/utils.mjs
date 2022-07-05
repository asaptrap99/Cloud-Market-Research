// import * as tf from '../../dependency/tensorflowJS/tf.es2017.js';

/* my color pallet */
export const darkModeCols = {
  red: (alpha = 1) => `rgba(255, 99, 132, ${alpha})`,
  orange: (alpha = 1) => `rgba(255, 159, 64, ${alpha})`,
  yellow: (alpha = 1) => `rgba(255, 205, 86, ${alpha})`,
  green: (alpha = 1) => `rgba(75, 192, 192, ${alpha})`,
  blue: (alpha = 1) => `rgba(54, 162, 235, ${alpha})`,
  purple: (alpha = 1) => `rgba(153, 102, 255,${alpha})`,
  grey: (alpha = 1) => `rgba(231,233,237,  ${alpha})`,
  magenta: (alpha = 1) => `rgba(255,0,255,  ${alpha})`,
  violet: (alpha = 1) => `rgba(255,0,255,   ${alpha})`,
  black: (alpha = 1) => `rgba(0,0,0,   ${alpha})`,
  white: (alpha = 1) => `rgba(255,255,255,   ${alpha})`,
  darkBlue: (alpha = 1) => `#222633`,
};

/**
 * this function checks if the given input is a tf.tensor object or not
 * @param {object} t
 * @return {boolean}
 */
export function isTensor(t) {
  return t instanceof tf.Tensor;
}

/**
 * this function simply maps elements to the position(index) specified by index map
 * @param {array} arr
 * @param {array} indexMap
 * @example
 *  const arr = ['a','b','c','d','e'];
 *  const indexMap = [3, 2, 4, 1, 0];
 *
 *  sortWithIndexMap(arr,indexMap); // returns ['d', 'c', 'e', 'b', 'a']
 * @return {object} return the sorted B
 */
export function sortWithIndexMap(arr, indexMap) {
  if (arr.length != indexMap.length) {
    throw new Error(
      `Error: Invalid Inputs, \n inputs must be of same size,but given:\n arr: ${arr.length} and indexMap: ${indexMap.length}`
    );
  }
  return arr.map((_, i) => arr[indexMap[i]]);
}

/**
 * this function simply sort the given array
 * @param {array} unsortedArray array to be sorted
 * @param {function} comparator this function tells us, which element is greater,smaller or equal by returning -1,1 or 0 respectively
 * @return {array} sorted Array
 */
export function quickSort(
  unsortedArray,
  comparator = (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
) {
  // Create a sortable array to return.
  const sortedArray = [...unsortedArray];

  // Recursively sort sub-arrays.
  const recursiveSort = (start, end) => {
    // If this sub-array is empty, it's sorted.
    if (end - start < 1) {
      return;
    }

    const pivotValue = sortedArray[end];
    let splitIndex = start;
    for (let i = start; i < end; i++) {
      const sort = comparator(sortedArray[i], pivotValue);

      // This value is less than the pivot value.
      if (sort === -1) {
        // If the element just to the right of the split index,
        //   isn't this element, swap them.
        if (splitIndex !== i) {
          const temp = sortedArray[splitIndex];
          sortedArray[splitIndex] = sortedArray[i];
          sortedArray[i] = temp;
        }

        // Move the split index to the right by one,
        //   denoting an increase in the less-than sub-array size.
        splitIndex++;
      }

      // Leave values that are greater than or equal to
      //   the pivot value where they are.
    }

    // Move the pivot value to between the split.
    sortedArray[end] = sortedArray[splitIndex];
    sortedArray[splitIndex] = pivotValue;

    // Recursively sort the less-than and greater-than arrays.
    recursiveSort(start, splitIndex - 1);
    recursiveSort(splitIndex + 1, end);
  };

  // Sort the entire array.
  recursiveSort(0, unsortedArray.length - 1);
  return sortedArray;
}

/**
 *
 * @param {Array} A javascript Array
 * @param {Array} B javascript Array
 * @description this function first sort array A and then sort B according to how the indexes of A changed when sorted
 * @example
 *  const A = [  5,  4,  8,  2, 1 ]; // 3, 2, 4, 1, 0
 *  const B = ['a','b','c','d','e'];
 *  sortAB(A,B) // returns [ [1,2,4,5,8], ['e','d','b','a','c'] ]
 * @return {Array} [sortedA, sortedB]
 */
export function sortAB(A, B) {
  // combining arrayA and arrayB
  const zipAB = A.map((v, i) => {
    return { valueA: v, valueB: B[i] };
  });

  // performing quicksort and storing the result in sortedArrayObj
  // you might note here that we are only sorting arrayA
  const sortedArrayObj = quickSort(zipAB, (v1, v2) => {
    if (v1.valueA < v2.valueA) return -1;
    if (v1.valueA > v2.valueA) return 1;
    return 0;
  });

  // extracting the sorted values of both the arrays
  const sortedA = sortedArrayObj.map((value) => value.valueA);
  const sortedB = sortedArrayObj.map((value) => value.valueB);

  return [sortedA, sortedB];
}

/**
 * a template for quickly creating an interactive input space
 * @param {string | object } divContainer parent dOM element
 * @param {object} svgSettings properties of this input space
 * @param {number} svgSettings.width width
 * @param {number} svgSettings.height height
 * @param {object} svgSettings.margin margin
 * @param {object} svgSettings.margin.top top
 * @param {object} svgSettings.margin.right right
 * @param {object} svgSettings.margin.bottom bottom
 * @param {object} svgSettings.margin.left left
 * @param {object} svgSettings.rangeX range of the x-axis
 * @param {object} svgSettings.rangeX.min min value
 * @param {object} svgSettings.rangeX.max max value
 * @param {object} svgSettings.rangeY range of the y-axis
 * @param {object} svgSettings.rangeY.min min value
 * @param {object} svgSettings.rangeY.max max value
 * @param {number} svgSettings.gridIntervel spacing between each bar of the background grid
 * @param {boolean} svgSettings.isGrid should we add a background grid?
 * @param {boolean} svgSettings.isAxisLine should we add axis lines?
 * @param {boolean} spawnPoints should we add on click data points?
 * @return {object} all the components which construct this input viz
 */
export function inputViz(divContainer, svgSettings, spawnPoints = true, dragfn) {
  const {
    width = 500,
    height = 500,
    margin = { top: 20, right: 20, bottom: 20, left: 20 },
    rangeX = { min: -10, max: 10 },
    rangeY = { min: -10, max: 10 },
    gridIntervel = 8,
    isGrid = true,
    isAxisLine = true,
  } = svgSettings;

  console.log(svgSettings);

  gridIntervel.x = gridIntervel.x || gridIntervel || 8;
  gridIntervel.y = gridIntervel.y || gridIntervel || 8;

  console.log(gridIntervel);
  // range of the plot
  const range = {
    x: {
      min: rangeX.min === undefined ? 5 : rangeX.min,
      max: rangeX.max === undefined ? 5 : rangeX.max,
    },
    y: {
      min: rangeY.min === undefined ? -5 : rangeY.min,
      max: rangeY.max === undefined ? -5 : rangeY.max,
    },
  };

  console.log(typeof divContainer);

  /**
   * function for a click event
   */
  function click() {
    // Ignore the click event if it was suppressed
    if (d3.event.defaultPrevented) return;

    // Extract the click location
    // const pt = pointPos(this, e);
    const pt = d3.mouse(this);
    const p = { x: pt[0], y: pt[1] };

    // reject the points that are outside the input area
    if (
      xInv(p.x) <= range.x.min ||
      xInv(p.x) >= range.x.max ||
      yInv(p.y) <= range.y.min ||
      yInv(p.y) >= range.y.max
    ) {
      console.warn('the input point is out side the input area');
      return;
    }

    console.log('yes', p, xInv(p.x), yInv(p.y));
    // Append a new point to our data Points group
    svg
      .select('.dataPoints')
      .append('circle')
      .attr('cx', p.x)
      .attr('cy', p.y)
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
    dragfn(x,y)
  }

  const svgContainerWidth =  width + margin.left + margin.right;

  // append the svg object
  const svg = (typeof divContainer === 'object'
    ? divContainer
    : d3.select(divContainer)
  )
    .append('svg')
    .attr('id', 'svgContainer')
    .attr('width', svgContainerWidth)
    .attr('height', height + margin.top + margin.bottom)
    // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .on('click', spawnPoints ? click : null);

  const beforeGridSpace = svg.append('g').attr('id', 'beforeGrid');

  // Add X axis
  const x = d3
    .scaleLinear()
    .domain([range.x.min, range.x.max])
    .range([margin.left, width - margin.right]);

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([range.y.min, range.y.max])
    .range([height - margin.bottom, margin.top]);

  // converting the pixel coordinate back to the desired range2
  const xInv = d3
    .scaleLinear()
    .domain([margin.left, width - margin.right])
    .range([range.x.min, range.x.max]);

  const yInv = d3
    .scaleLinear()
    .domain([height - margin.bottom, margin.top])
    .range([range.y.min, range.y.max]);

  const gridGrp = svg.append('g').attr('id', 'grid');

  const gridIntervelsX = tf
    .linspace(range.x.min, range.x.max, gridIntervel.x)
    .flatten()
    .arraySync();
  const gridIntervelsY = tf
    .linspace(range.y.min, range.y.max, gridIntervel.y)
    .flatten()
    .arraySync();

  const lineGenerator = d3.line();

  console.log("alsdkfjsldf")
  if (isGrid) {
    // vertical grid lines
    gridGrp
      .append('g')
      .selectAll('path')
      .data(gridIntervelsX)
      .enter()
      .append('path')
      .attr('d', function (d) {
        return lineGenerator([
          [x(d), y(range.y.min)],
          [x(d), y(range.y.max)],
        ]);
      })
      .style('stroke', 'gray')
      .attr('opacity', 0.5);

    // horizontal grid lines
    gridGrp
      .append('g')
      .selectAll('path')
      .data(gridIntervelsY)
      .enter()
      .append('path')
      .attr('d', function (d) {
        return lineGenerator([
          [x(range.x.min), y(d)],
          [x(range.x.max), y(d)],
        ]);
      })
      .style('stroke', 'gray')
      .attr('opacity', 0.5);
  }

  // create group for data points
  const dataPointsGrp = spawnPoints
    ? svg.append('g').attr('class', 'dataPoints')
    : null;

  // creating a space after grid for future use.
  const afterGridSpace = svg.append('g').attr('id', 'afterGrid');

  // create frame so that even if the elements in the 'spaces' (like in beforeGridSpace and afterGridSpace) overflows, this doesn't overlap with our axis scales
  const frame = svg.append('g').attr('id', 'frame');

  frame
    .append('rect')
    .attr('width', width + margin.left + margin.right)
    .attr('height', margin.top);

  frame
    .append('rect')
    .attr('width', margin.left)
    .attr('height', height + margin.bottom + margin.top);

  frame
    .append('rect')
    .attr('transform', `translate(${0},${height - margin.bottom}) `)
    .attr('width', width)
    .attr('height', margin.bottom + margin.bottom + margin.top);

    const rightFramePosX = width - margin.right;
  frame
    .append('rect')
    .attr('transform', `translate(${rightFramePosX},${0}) `)
    .attr('width',svgContainerWidth - rightFramePosX )
    .attr('height', height + margin.right);

  svg
    .append('g')
    .attr(
      'transform',
      `translate(${0 * margin.left}, ${height - margin.bottom})`
    )
    .call(d3.axisBottom(x));

  svg
    .append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  const originAxis = svg.append('g').attr('class', 'originAxis');

  if (isAxisLine) {
    // origin x-axis
    originAxis
      .append('path')
      .attr(
        'd',
        lineGenerator([
          [x(range.x.min), y(0)],
          [x(range.x.max), y(0)],
        ])
      )
      .attr('stroke-width', 3)
      .attr('opacity', 0.5)
      .attr('stroke', 'blue');

    // origin y-axis
    originAxis
      .append('path')
      .attr(
        'd',
        lineGenerator([
          [x(0), y(range.y.min)],
          [x(0), y(range.y.max)],
        ])
      )
      .attr('stroke-width', 3)
      .attr('opacity', 0.5)
      .attr('stroke', 'red');
  }

  // save all the components for future use...
  return {
    svg,
    svgSettings,
    originAxis,
    dataPointsGrp,
    conversionFns: { x, y, xInv, yInv },
    spaces: { beforeGridSpace, afterGridSpace },
    frame,
  };

  // return this;
}


/**
 * a template for quickly creating an interactive input space
 * @param {string | object } divContainer parent dOM element
 * @param {object} svgSettings properties of this input space
 * @param {number} svgSettings.width width
 * @param {number} svgSettings.height height
 * @param {object} svgSettings.margin margin
 * @param {object} svgSettings.margin.top top
 * @param {object} svgSettings.margin.right right
 * @param {object} svgSettings.margin.bottom bottom
 * @param {object} svgSettings.margin.left left
 * @param {object} svgSettings.rangeX range of the x-axis
 * @param {object} svgSettings.rangeX.min min value
 * @param {object} svgSettings.rangeX.max max value
 * @param {object} svgSettings.rangeY range of the y-axis
 * @param {object} svgSettings.rangeY.min min value
 * @param {object} svgSettings.rangeY.max max value
 * @param {number} svgSettings.gridIntervel spacing between each bar of the background grid
 * @param {boolean} svgSettings.isGrid should we add a background grid?
 * @param {boolean} svgSettings.isOriginLine should we add axis lines?
 * @return {object} all the components which construct this input viz
 */
export function linePlot(divContainer, data, svgSettings) {
  const {
    width = 500,
    height = 500,
    margin = { top: 20, right: 20, bottom: 20, left: 30 },
    gridIntervel = {},
    isGrid = false,
    isOriginLine = false,
    isDynamicRange = true, // should the range be automatically calcualated from data?
    isFrame = true,
    showAxis = true,
  } = svgSettings;

  // params will be modified later on.
  let {
    rangeX = { min: -10, max: 10 },
    rangeY = { min: -10, max: 10 },
  } = svgSettings


  console.log(svgSettings);

  gridIntervel.x = gridIntervel.x || gridIntervel || 8;
  gridIntervel.y = gridIntervel.y || gridIntervel || 8;


  console.log(gridIntervel);
  // range of the plot


  if (!data.length)
    data = [data];

  if (isDynamicRange){

    // initializing range values to a arbitrary data point
    rangeX = {min: data[0].values[0].x, max: data[0].values[0].x }
    rangeY = {min: data[0].values[0].y, max: data[0].values[0].y }

    // extracting min and max values from the data.
    data.map(
      
      (cData)=>{
        cData.values.map(pt=> {
            if (pt.x < rangeX.min)rangeX.min = pt.x;
            if (pt.y < rangeY.min)rangeY.min = pt.y;
            
            
            if (pt.x > rangeX.max)rangeX.max = pt.x;
            if (pt.y > rangeY.max)rangeY.max = pt.y;
          }
        )
      }
    )

  }



  // TODO: remove this block (its useless)
  const range = {
    x: {
      min: rangeX.min === undefined ? 5 : rangeX.min,
      max: rangeX.max === undefined ? 5 : rangeX.max,
    },
    y: {
      min: rangeY.min === undefined ? -5 : rangeY.min,
      max: rangeY.max === undefined ? -5 : rangeY.max,
    },
  };





  const parentElem = d3.select(divContainer);

  let svg = parentElem.select('#svgContainer');
  let beforeGridSpace = svg.select('#beforeGrid');
  let gridGrp = svg.select('#grid');
  let verticalGridGrp = gridGrp.select('#gridVertical');
  let horizontalGridGrp = gridGrp.select('#gridHorizontal');
  let dataPointsGrp = svg.select('.dataPoints')
  let afterGridSpace = svg.select('#afterGridSpace');
  let frame = svg.select('#frame');
  let originAxis = svg.select('#originAxis')

  // a flag which indicate if we are updating or initializing a new viz
  const initSvg = svg.empty();

  console.log('initSvg: ',initSvg);

  // Add X axis
  const x = d3
    .scaleLinear()
    .domain([range.x.min, range.x.max])
    .range([margin.left, width - margin.right]);

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([range.y.min, range.y.max])
    .range([height - margin.bottom, margin.top]);

  // converting the pixel coordinate back to the desired range2
  const xInv = d3
    .scaleLinear()
    .domain([margin.left, width - margin.right])
    .range([range.x.min, range.x.max]);

  const yInv = d3
    .scaleLinear()
    .domain([height - margin.bottom, margin.top])
    .range([range.y.min, range.y.max]);


  const gridIntervelsX = tf
    .linspace(range.x.min, range.x.max, gridIntervel.x)
    .flatten()
    .arraySync();
  const gridIntervelsY = tf
    .linspace(range.y.min, range.y.max, gridIntervel.y)
    .flatten()
    .arraySync();

  const lineGenerator = d3.line();

  // append the svg object
  if (initSvg){
    console.log('yes inside it');

    svg = parentElem
    .append('svg')
    .attr('id', 'svgContainer')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    beforeGridSpace = svg.append('g').attr('id', 'beforeGrid');



  // if grid already exist then use that instead
    gridGrp = svg.append('g').attr('id', 'grid');

    verticalGridGrp = gridGrp
      .append('g')
      .attr('id', 'gridVertical')

    horizontalGridGrp = gridGrp
      .append('g')
      .attr('id', 'gridHorizontal');

    // create group for data points
    dataPointsGrp = svg.append('g').attr('class', 'dataPoints');

    // creating a space after grid for future use.
    afterGridSpace = svg.append('g').attr('id', 'afterGrid');


    if (isFrame)
      frame = svg.append('g').attr('id', 'frame');
   
    if (isOriginLine)
      originAxis = svg.append('g').attr('id', 'originAxis');
  }

  if (isGrid) {


    // vertical grid lines
    const vGridPaths = verticalGridGrp.selectAll('path');

    verticalGridGrp
      .selectAll('path')
      .data(gridIntervelsX)
      .enter()
      .append('path')
      .merge(vGridPaths)
      .attr('d', function (d) {
        return lineGenerator([
          [x(d), y(range.y.min)],
          [x(d), y(range.y.max)],
        ]);
      })
      .style('stroke', 'gray')
      .attr('opacity', 0.5);

    // horizontal grid lines
    const hGridPaths = horizontalGridGrp.selectAll('path');
    horizontalGridGrp
      .selectAll('path')
      .data(gridIntervelsY)
      .enter()
      .append('path')
      .merge(hGridPaths)
      .attr('d', function (d) {
        return lineGenerator([
          [x(range.x.min), y(d)],
          [x(range.x.max), y(d)],
        ]);
      })
      .style('stroke', 'gray')
      .attr('opacity', 0.5);
  }


 

  for(let i=0;i< data.length;i++){

    // throwing errors
    if (data[i].values){
      if (!(data[i].values[0].x !== undefined && data[i].values[0].y !== undefined)){
        throw new Error('values must be of format: [{x: 2, y: 4}, {x: 3, y: 6},....]. but given'+data[i].values)
      }
    }
    else{
      throw new Error('values are not given')
    }


    if (!data[i].name){
      console.warn('name is not specified, using generic name');
      data[i].name = 'dataGrp_'+i;
    }


    let cDataGrp = dataPointsGrp.select('#'+data[i].name)

    if (initSvg){
      cDataGrp = dataPointsGrp.append('g').attr('id', data[i].name);
    }

    console.log('data values:', data[i].values);

    const cDataGrpSelect = cDataGrp.selectAll('path');
    cDataGrpSelect
      .data([data[i].values])
      .enter()
      .append('path')
      .merge(cDataGrpSelect)
      .transition()
      .duration(
       
        // account for situation where the transition or  duration is not specified
        (()=>{
          if (data[i].transition){
           return data[i].transition.duration || 10
          }
          return 10;
        })()
        
        )
      .ease( 
       
        // account for situation where the transition or  ease is not specified
        (()=>{
          if (data[i].transition){
           return data[i].transition.ease || d3.easeLinear
          }
          return d3.easeLinear;
        })()
        
        )
      .attr(
        'd',
        d3
          .line()
          .x(function (d) {
            return x(d.x);
          })
          .y(function (d) {
            console.log('its working');
            return y(d.y);
          })
          .curve(data[i].curve || d3.curveCardinal)
      )
      .attr('fill', 'none')
      .attr('stroke', data[i].color || darkModeCols.red(1.0))
      .attr('stroke-width', data[i].strokeWidth || 2.5)

  }


  // create frame so that even if the elements in the 'spaces' (like in beforeGridSpace and afterGridSpace) overflows, this doesn't overlap with our axis scales
  if (initSvg && isFrame){

    frame
      .append('rect')
      .attr('width', width + margin.left*0 + margin.right*0)
      .attr('height', margin.top);

    frame
      .append('rect')
      .attr('width', margin.left)
      .attr('height', height + 0*margin.bottom);

    frame
      .append('rect')
      .attr('transform', `translate(${0},${height - margin.bottom}) `)
      .attr('width', width)
      .attr('height', margin.bottom);

    frame
      .append('rect')
      .attr('transform', `translate(${width - margin.right},${0}) `)
      .attr('width', margin.right)
      .attr('height', height + 0*margin.right);

  }

 if (showAxis){

  if (initSvg){

    svg
      .append('g')
      .attr('class', 'axisBottom')
      .attr(
        'transform',
        `translate(${0 * margin.left}, ${height - margin.bottom})`
      )
      .call(d3.axisBottom(x));

    svg
      .append('g')
      .attr('class', 'axisLeft')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

  }else{

  const axisBottom = svg.selectAll('g.axisBottom');
  const axisLeft = svg.selectAll('g.axisLeft');

    axisBottom
      .call(d3.axisBottom(x));

    axisLeft
      .call(d3.axisLeft(y));

  }

 }

  if (isOriginLine && (initSvg)) {
    // origin x-axis
    originAxis
      .append('path')
      .attr(
        'd',
        lineGenerator([
          [x(range.x.min), y(0)],
          [x(range.x.max), y(0)],
        ])
      )
      .attr('stroke-width', 3)
      .attr('opacity', 0.5)
      .attr('stroke', 'blue');

    // origin y-axis
    originAxis
      .append('path')
      .attr(
        'd',
        lineGenerator([
          [x(0), y(range.y.min)],
          [x(0), y(range.y.max)],
        ])
      )
      .attr('stroke-width', 3)
      .attr('opacity', 0.5)
      .attr('stroke', 'red');
  }

  // save all the components for future use...
  return {
    svg,
    svgSettings,
    originAxis,
    dataPointsGrp,
    conversionFns: { x, y, xInv, yInv },
    spaces: { beforeGridSpace, afterGridSpace },
    frame,
  };

}