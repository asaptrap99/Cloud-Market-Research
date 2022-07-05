let darkModeCols = {
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

function convert2dArray(ndArr) {
  // storing the shape of ndArray
  const shape = ndArr.shape;

  const nElems = shape[0];
  const nFeatures = shape[1] || 1;

  // fetch all the elements
  const arraySerialized = Array.from(ndArr.elems());

  // console.log
  const jsArray = Array(shape[0]);

  for (let i = 0; i < nElems; i++) {
    const cArrayRow = Array(nFeatures);
    for (let j = 0; j < nFeatures; j++) {
      const index = i * nFeatures + j;

      const currVal = arraySerialized[index][1];
      if (nFeatures === 1) {
        jsArray[i] = typeof currVal === "object" ? currVal.re : currVal;
      } else {
        cArrayRow[j] = typeof currVal === "object" ? currVal.re : currVal;
      }
    }
    if (nFeatures !== 1) jsArray[i] = cArrayRow;
  }
  return jsArray;
}

function Img2Arr(img) {
  console.log("myIMG:", img);
  const imgWidth = img.width / 1;
  const imgHeight = img.height / 1;

  const imgArray = [];

  // const imgPixels = img.pixels;
  for (let i = 0; i < imgHeight; i++) {
    const imgRow = [];
    for (let j = 0; j < imgWidth; j += 1) {
      const index = i * imgWidth + j;

      imgRow.push(img.get(i, j)[0]);
    }

    imgArray.push(imgRow);
  }
  return imgArray;
}

/**
 *
 * @param {*} x
 * @param {*} y make sure they are one hot encoded.
 */
function classwiseDataSplit(x, y, concatClass = 0) {
  // make sure y is a one hot encoded vector.

  const nClasses = y.shape[1];

  const yArray = y.arraySync();
  const xArray = x.arraySync();

  const xSplit = [];
  for (let i = 0; i < nClasses; i++) {
    let currClassSplit = xArray.filter(function(_, index) {
      return this[index][i];
    }, yArray);

    // convert to tensor
    currClassSplit = tf.tensor(currClassSplit);

    
    const currClassY = tf.tile(
          insert2Tensor(tf.zeros([1, nClasses]), tf.tensor([1]).expandDims(1), [
            0,
            i
          ]),
          [currClassSplit.shape[0], 1]
        );

    xSplit.push({x: currClassSplit, y: currClassY});

  }


  return xSplit;
}

/**
 *
 * @param {*} x input must be a 'tf.tensor'
 */
function tf2nd(x) {
  // FIXIT:
  // if ( x instanceof tf )return nd.array ( x.arraySync() );
  if (true) return nd.array(x.arraySync());

  console.warn("the input is not tf.tensor");
  return x;
}

/**
 *
 * @param {*} x input must be an 'nd.array'
 */
function nd2tf(x) {
  // if ( x instanceof nd )return tf.tensor( convert2dArray( x ) );
  if (true) return tf.tensor(convert2dArray(x));

  console.warn("the input is not nd.array");
  return x;
}

function tfpinv(x) {
  return tf.tensor(pinv(x.arraySync()));
}

/**
 *
 * @param {*} x must be a javascript array
 * @description using moore-penrose psudoinverse procedure for calculating inverse of X
 * @returns return javascript Array of the pinv of X
 */
function pinv(x) {
  // convert js array to nd array
  const ndX = nd.array(x);

  // compute SVD NOTE: nd svd automatically remove the zero components in the singular matrix
  const xSVD = nd.la.svd_decomp(ndX);

  const { 0: lSVec, 1: singularVal, 2: rSVec } = xSVD;

  // compute the inverse of singularVec
  const singularDiag = nd.la.diag_mat(singularVal);

  const modDiag = singularDiag.forElems((val, i, j) => {
    if (i === j) singularDiag.set([i, j], 1 / val);
  });

  // now construct back the matrix in order to get our matrix psudo-inverse.
  const xInv = nd.la.matmul(lSVec, singularDiag, rSVec);

  return convert2dArray(xInv);
}

/**
 *
 * @param {*} x input must be a tf.tensor object where, shape[0] = no. of samples and shape[1] = no. of features
 * @param {*} meanCenter should input be mean centric before normalizing?
 * @returns normalized input matrix
 */
function normalize(x, meanCenter = 0) {
  // make the matrix mean centric.
  if (meanCenter) {
    const meanX = tf.mean(x, (axis = 0));
    x = x.sub(meanX);
  }

  // calculating the norm of all the axis
  let normVec = x.norm((axis = 1)).reshape([1, 1]);
  for (let i = 2; i < x.shape[1] + 1; i++) {
    normVec = normVec.concat(x.norm((axis = i)).reshape([1, 1]), (axis = 1));
  }

  // dividing x with its norm to get normalized x;
  return x.div(normVec);
}

function remap(n, start1, stop1, start2, stop2, withinBounds) {
  var newval = ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  return newval;
}

function relativeMap(arrA, arrA_prime, arrB) {
  // this function takes arrA_prime and then replace arrA values with the corresponding arrB values assuming that B = f(A)

  /**
   * Example:-
   *      A = [1,2,3,4]
   *      B = [1,4,9,16] // here, B = (f(a) => a**2) i.e, they both somehow related to each other.
   *      A_prime = [0.0,0.5,1.0 ,1.5,2.0, 2.5,3.0, 3.5,4.0]
   *
   *      newArrA = [0.0,0.5,1.0 ,1.5,4.0, 2.5,9.0, 3.5,16.0]
   */

  let newArrA = arrA.slice(0);
  for (let i = 0; i < arrA_prime.length; i++) {
    let cAprimeVal = arrA_prime[i];
    let idxInArrA = arrA.indexOf(cAprimeVal);
    if (idxInArrA !== -1) newArrA[idxInArrA] = arrB[i];
  }
  return newArrA;
}

/**
 *
 * @param {*} A
 * @param {*} B
 * @param {*} A_sorted
 * @returns return the sorted B
 */
function sortWithIndexMap(B, indexMap) {
  // indexMap = [3,1,2]

  if (B.length != indexMap.length) {
    throw new Error(
      `Error: Invalid Inputs, \n inputs must be of same size,but given:\n B: ${
        B.length
      } and indexMap: ${indexMap.length}`
    );
    return false;
  }

  const B_sorted = Array(indexMap.length).fill(0);
  for (let i = 0; i < B_sorted.length; i++) {
    const g = indexMap[i];
    B_sorted[i] = B[g];

    // console.log(g,B_sorted[g]);
  }

  return B_sorted;
}

/**
 *
 * @param {Array} A javascript Array
 * @param {Array} B javascript Array
 * @description this function first sort array A and then sort B according to how the indexes of A changed when sorted
 * @example
 *  const A = [  5,  4,  8,  2, 1 ]
 *  const B = ['a','b','c','d','e']
 *  sortAB(A,B) // returns [ [1,2,4,5,8], ['e','d','b','a','c'] ]
 */
function sortAB(A, B) {
  const sortedIndexA = [];
  for (let i = 0; i < A.length; i++) {
    sortedIndexA.push(i);
  }

  const sortedA = A.slice();
  for (let i = 0; i < A.length; i++) {
    for (let j = i + 1; j < A.length; j++) {
      let cVal_i = sortedA[i];
      let cVal_j = sortedA[j];

      if (cVal_i > cVal_j) {
        // swap `em
        let foo = cVal_i;
        sortedA[i] = sortedA[j];
        sortedA[j] = foo;

        // swap the indexArray as well
        foo = sortedIndexA[i];
        sortedIndexA[i] = sortedIndexA[j];
        sortedIndexA[j] = foo;
      }
    }
  }
  // console.log(sortedIndexA,sortedA,A,Math.min(sortedA));
  return [sortedA, sortWithIndexMap(B, sortedIndexA)];
}

function prepro4Plotly(x) {
  if (x.constructor.toString().indexOf("Array") == -1)
    throw new Error('Error: Input Must Be of Type "Array"  ');

  return tf
    .tensor(x)
    .transpose()
    .reverse((axis = 0))
    .arraySync();
}

/**
 *
 * @param {object} range {x: {min: number, max: number}, y: {min: number, max: number}}
 * @param {number} division division b/w the range.
 */
function meshGridRange(
  range = { x: { min: 0, max: 1 }, y: { min: 0, max: 1 } },
  division,
  margin=1.0
) {
  console.log(range);
  const a = tf
    .linspace(range.x.min - margin, range.x.max + margin, division)
    .flatten()
    .arraySync();
  const b = tf
    .linspace(range.y.min - margin, range.y.max + margin, division)
    .flatten()
    .arraySync();

  return meshGrid(a, b);
}

/**
 *
 * @param {Array} a array of values in axis=0
 * @param {Array} b array of values in axis=1
 * @throws will throw an error if (a.length != b.length).
 * @returns returns multidim js-array.
 */
function meshGrid(a, b) {
  // input must be an array
  // if(a.length !== b.length)throw new Error ( "Error: Input must be of same length.");

  // // TODO: remove this error function when we fixed its use in all the codes.
  // console.error("MESH GRID FUNCTION HAS BEEN MODIFIED.. check for compactiblity!");


  if(a.length !== b.length)
    throw new Error (`mismatched size, array must be of same size but give : \n a.length= ${a.length} and b.length =${b.length} `)

  const gridArray = [];
  // for (let i = 0; i < a.length; i++) {
  //   const cRow = []; // current row
  //   const cVal_i = a[i];
  //   for (let j = 0; j < b.length; j++) {
  //     const cVal_j = b[j];
  //     cRow.push(cVal_j);
  //   }
  //   gridArray.push([cRow, Array(cRow.length).fill(cVal_i)]);
  // }

  for(let i=0;i< a.length;i++){
    const cRow = [];
    for(let j=0;j<b.length;j++){

      cRow.push([a[i], b[j]]);
    }

    gridArray.push(cRow);
  }


  return gridArray;
}

function meshTensor(min, max, div, nDims=2){

  const inp = tf.linspace(min, max , div).flatten().arraySync();

  let indexes = Array(nDims).fill(0);

  let nPts = 0;
  let isFinished = 0; // set the isFinished flag to 1 if indexes[nDims-2] < (div)

  const out = [];
  while(!isFinished){

    for(let i=0;i< div;i++){
      const currPt = [];

      nPts ++;
      for(let j=0;j< nDims;j++){
        currPt.push( inp[indexes[j]]);

        if((nPts % div**(j)) === 0){
          indexes[j] = indexes[j]+1;

          if (indexes[nDims-1] === (div)){
            isFinished = 1;
            continue;
          }
          // if exceed the div then reset
          if(indexes[j] === (div)){
            indexes[j] = 0;
          }

        }
      }
      out.push(currPt);
    }

  }

  return out;

}







/**
 *
 * @param {object} matrix input must be a tf.tensor object of shape NxM
 * @param {function } callbackFn callback function which modifies every element of the tensor object
 */
function tfMap(matrix, callbackFn) {
  const array = matrix.arraySync();
  const modArray = array.map(cRow => cVal => {
    callbackFn(cVal);
  });

  // return the modified tf.tensor
  return tf.tensor(modArray);
}

/**
 *
 * @param {object} vector input must be of shape Nx1 or 1xN
 * @return returns the sorted tf.tensor object
 */
function tfSort(vector) {
  if (vector.shape[1] > 1)
    throw new Error(" input must be of shape nx1 or 1xn.");
  const array = tensor.flattten().arraySync();

  const sortedArray = quickSort(array);

  // return the sorted tf.tensor;
  return tf.tensor(sortedArray);
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break;
    }
  }
}

/**
 *
 * @param {string} type type of const function we require
 * @summary given the type this function returns a cost function which takes 3 params
 * data 'y' values and predicted 'y' value.
 */
function costFunction(type) {
  if (type === "mse") {
    // mean-squared-error (yPred - y)**2
    return function(y, yPred) {
      return tf.sum(tf.pow(tf.sub(yPred, y), 2));
    };
  }

  // add other cost function like R^2 etc.
}

/**
 *
 * @param {string} type type of const function we require
 * @summary given the type this function returns a cost function derivatives which takes 3 params
 * data x and y values and predicted 'y' value.
 */
function costFnDerivatives(type) {
  if (type === "mse") {
    return function(x, y, yPred) {
      // d/dx of MSE w.r.t 'w' : (yPred - y)x
      return tf.matMul(x.transpose(), tf.sub(yPred, y));
    };
  }
}

/**
 *
 * @param {object} x tf.tensor input data X
 * @param {object} y input data Y of type tf.tensor
 * @param {object} params important paramters for our optimizer
 * @param {function } params.yPridFn this function is provided with dataX and weights and returns the prediction Y
 * @param {function } params.costFn function which calculates the cost function given the data Y and predicted Y
 * @param {function}  params.costFnDx function which spits out the derivative of the cost function
 * @param {function}  params.callback a simple callback function which gets called at every epoch
 * @param {null}      params.yPred helpful for transfer learning
 * @param {object}    params.weights if you have pretrained weights vector, you can plug it in here, useful for transfer learning
 * @param {number}    params.epoch maximum number of gradient descent steps
 * @param {number}    params.learningRate
 * @param {number}    params.threshold the maximum amount allowable difference between prediction and truth.
 * @summary this function tries to find the weights which maximize/minimize the const function and using the parameters
 */
function optimize(
  x,
  y,
  params = {
    yPredFn: function(x, w) {
      return tf.matMul(w, x);
    },
    costFn: costFn("mse"),
    costFnDx: costFnDerivatives("mse"),
    callback: null,
    yPred: null,
    weights: null,
    epoch: 1000,
    learningRate: 0.001,
    threshold: 1e-3,
    verbose: false,
    batchSize: -1
  }
) {
  let {
    yPredFn = function(x, w) {
      return tf.matMul(w, x);
    },
    costFn = costFunction("mse"),
    costFnDx = costFnDerivatives("mse"),
    callbackFn = null,
    yPred = null,
    weights = null,
    epoch = 100,
    learningRate = 0.0005,
    threshold = 1e-3,
    verbose = false,
    batchSize = -1
  } = params;

  // initializing weights vector tf.matMul( x, oldWeights).
  if (!weights) {
    // works only if x.shape = [m,n...] where, m == no. of training samples.
    weights = tf.randomNormal([x.shape[1], 1]);
  }

  let oldWeights = weights;
  for (let i = 0; i < epoch; i++) {
    const dataShuffleArray = x.concat(y, (axis = 1)).arraySync();
    tf.util.shuffle(dataShuffleArray);

    const cBatchX = tf
      .tensor(dataShuffleArray)
      .slice([0, 0], [-1, x.shape[1]])
      .slice([0, 0], [batchSize, -1]);
    const cBatchY = tf
      .tensor(dataShuffleArray)
      .slice([0, x.shape[1]], [-1, -1])
      .slice([0, 0], [batchSize, -1]);

    // calculating new prediction and loss function.
    yPred = yPredFn(cBatchX, oldWeights);
    const loss = costFn(cBatchY, yPred);

    if (verbose) {
      console.log('epoch: '+i+'\n');

      console.log("loss:- ");
      loss.print();

      console.log("oldWeights:- ");
      oldWeights.print();
    }

    // checking convergence.
    if (loss.arraySync() < threshold) {
      console.log('loss converged! @' +i+ 'epoch \n'+'loss: '+loss.arraySync() )
      yPred.print();
      return oldWeights;
    }

    // Calculating and Updating new Weights
    const weightDx = costFnDx(cBatchX, cBatchY, yPred, loss);
    const newWeights = tf.sub(
      oldWeights,
      tf.mul(tf.scalar(learningRate), weightDx)
    );

    // reAssigning weights
    oldWeights = newWeights;

    // invoke the callback function
    if (callbackFn !== null) {
      console.log("inside Callback");
      callbackFn(cBatchX, cBatchY, yPred, oldWeights, loss);
    }
  }
  console.log(epoch+'epoach finished!');

  return oldWeights;
}

/**
 *
 * @param {object} data input must be a tf tensor object
 */
function normalizeData(data, unitVariance=0, giveMeanStdev=0) {

  const mean =  data.mean(axis = 0);
  const meanCenteredData = data.sub( mean);

  if(!unitVariance)
    return meanCenteredData;

  const stdev = normalizeData(meanCenteredData, 0).pow(2).mean().sqrt();

  // z-score
  data = meanCenteredData.div(stdev);

  if(giveMeanStdev)
    return {data, mean, stdev};

  return data;
}

function tfCov(tensor){

  return tensor.transpose().matMul(tensor).div(tensor.shape[0] -1)
}




//NOTE: currently support only the [m,k] vector in [m,n] matrix where, k <= (start - n)
function insert2Tensor(originalTensor, insertTensor, start = []) {
  // const end = insertTensor.shape();
  // originalTensor.slice(start,end);

  const part1 = originalTensor.slice([0, 0], [-1, start[1]]);
  const part2 = originalTensor.slice(
    [0, start[1] + insertTensor.shape[1]],
    [-1, -1]
  );

  return part1.concat(insertTensor, (axis = 1)).concat(part2, (axis = 1));
}

// this function generates the span hyperplane given the Matrix/ basis vectors of column space
/**
 *
 * @param {object} A matrix of size [m,n]
 * @param {number} fac the size of the hyperplane
 * @summary this function construct a hyperplane using the basis vector of the column space of A.
 * the general useage of this method is to use it to visualize the span of the matrix 'A'.
 * @returns it returns the object inwhich {x : // x-compoents of all the sides of the hyperplane // ,y: //y-compnent// , z: // z- compenent // }, respectively.
 */
function genSpan(A, fac) {
  // first... convert it into an orthogonal matrix
  const Aortho = tf.linalg.gramSchmidt(A.transpose()).transpose();

  const p1 = Aortho.mul(fac);
  const p2 = Aortho.mul(-fac);

  // now connect p1 and p2 to form a hyperplane
  const combined = p1.concat(p2, (axis = 1));
  return {
    x: combined.slice([0, 0], [1, -1]),
    y:
      combined.shape[0] >= 2
        ? combined.slice([1, 0], [1, -1])
        : tf.zeros([1, combined.shape[0]]),
    z:
      combined.shape[0] === 3
        ? combined.slice([2, 0], [1, -1])
        : tf.zeros([1, combined.shape[0]])
  };
}

function replace2Tensor(originalTensor, replacedTensor, start = [0, 0]) {
  // check if the starting point is inside the originalTensor shape.
  if (
    start[0] < 0 &&
    start[1] < 0 &&
    start[0] > originalTensor.shape[0] &&
    start[1] > originalTensor.shape[1]
  )
    new Error("invalid starting point specified");

  const part1_left = originalTensor.slice([0, 0], [-1, start[1]]);

  const part2_top = originalTensor.slice(
    [0, start[1]],
    [
      start[0],
      start[1] + replacedTensor.shape[1] <= originalTensor.shape[1]
        ? replacedTensor.shape[1]
        : -1
    ]
  );

  const part4_right = (function() {
    if (start[1] + replacedTensor.shape[1] > originalTensor.shape[1])
      return tf.tensor([]);

    return originalTensor.slice(
      [0, start[1] + replacedTensor.shape[1]],
      [-1, -1]
    );
  })();

  const part3_down = (function() {
    if (start[0] + replacedTensor.shape[0] > originalTensor.shape[0])
      return tf.tensor([]);

    return originalTensor.slice(
      [start[0] + replacedTensor.shape[0], start[1]],
      [
        -1,
        start[1] + replacedTensor.shape[1] <= originalTensor.shape[1]
          ? replacedTensor.shape[1]
          : -1
      ]
    );
  })();

  // now putting all the parts together

  // tiling up part1_top, replacedTesor and part3_down
  let midSection = part2_top
    .concat(replacedTensor.slice([0, 0], [-1, part2_top.shape[1]]), (axis = 0))
    .concat(part3_down, (axis = 0));

  // console.log
  midSection = midSection.slice([0, 0], [originalTensor.shape[0], -1]);

  const newTensor = part1_left
    .concat(midSection, (axis = 1))
    .concat(part4_right, (axis = 1));

  return newTensor;
}

/**
 *
 * @param {object} V  tf.tensor object of shape m by 1 which is essentially just a Vector
 * @summary given a tensor of shape [n, 1] this function convert it into diagonal matrix inwhich the diagonal entries corresponding to
 * each values in the input tensor 'X' or  given a square matrix[n, n] this function extracts its diagonal and returns a tensor of shape [n, 1]
 */
function tfDiag(X) {
  if (!X.shape[1]) {
    X = X.expandDims(1);
  } else {
    if (X.shape[0] === X.shape[1]){
         return X.mul( tf.eye(X.shape[0],X.shape[0])).matMul(tf.ones([X.shape[0],1]))

    }
    
    if(X.shape[1] !== 1) 
    {
      throw new Error(
        `input must either be of shape [n,1] or of size [n,n] but given ${X.shape}`
      );
    }

  }
  return X.mul(tf.eye(X.shape[0]));
}

/**
 *
 * @param {object} X input must be a tf.tensor
 * @param {object} Y input must be a tf.tensor and it must be a one hot encoded vector
 * @param {array} percent specify the percentage of train / test data spliting or if 2 values are specified then the second value corresponds to the additional cross-validation set split.
 */
function trainTestSplit(X, Y, percent=0.8, shuffle=true) {
  /**
   * TODO:-
   * 1. split the data according to there corresponding classes
   * 2. shuffle the data points
   * 3. take _percent_ data as a training data and rest of them as test data.
   * 4. if _percent.length_ === 2 then split the test data into _percepnt[1]_ as cross-validation set.
   * 5. concat all the classwise X data for all the 3 sets (train,cross-validation and test)
   * 6. return all the 3 sets.
   */

  percent = percent.length ? percent : [percent]; // if the percent is just a number then convert it into array of length 1

  let totalPercent = 0;
  for(let i=0;i< percent;i++)
    totalPercent += percent[i]

  if (totalPercent >= 1.0)
    throw new Error('the total percent must be equal to 1')

  let classwiseX = X.concat(Y, axis=1);


  //  * 2. shuffle the data points of each class

  if (shuffle){
    const currClassXArray = classwiseX.arraySync();
    tf.util.shuffle(currClassXArray);
    classwiseX = tf.tensor(currClassXArray);

  }


  //  * 3. take _percent_ data as a training data and rest of them as test data.

  let classwiseXTrain = tf.tensor([]);
  let classwiseXCV = tf.tensor([]);
  let classwiseXTest = tf.tensor([]);

    const percentLength   = Math.floor(classwiseX.shape[0] * percent[0]);
    const percentCVLength = Math.floor(classwiseX.shape[0] * percent[1]);

    classwiseXTrain = classwiseXTrain.concat(
      classwiseX.slice([0, 0], [percentLength, -1])
    );

    const otherData = classwiseX.slice([percentLength, 0], [-1, -1]);

    //  * 4. if _percent.length_ === 2 then split the test data into _percepnt[1]_ as cross-validation set.

    if (percent.length === 2) {
      classwiseXCV = classwiseXCV.concat(
        otherData.slice([0, 0], [percentCVLength, -1])
      );
    }

    classwiseXTest = classwiseXTest.concat(
      classwiseX.slice([((percent.length===2)?percentCVLength : percentLength), 0], [-1, -1])
    );

  //  * 6. return all the sets.

  // add train set
  const retVal = [{
                    x: classwiseXTrain.slice([0, 0], [-1, X.shape[1]]),
                    y: classwiseXTrain.slice([0,X.shape[1]], [-1, -1])
                  }];

  if (percent.length === 2) {
    // include corss-validation set as well
    retVal.push({
                  x: classwiseXCV.slice([0, 0], [-1, X.shape[1]]), 
                  y: classwiseXCV.slice([0,X.shape[1]], [-1, -1])
                });
  }

  // add test set

  // if the percent is 1.0 then don't include the test set.
  if (percent[0] === 1.0)
    return retVal


  retVal.push({
                x: classwiseXTest.slice([0, 0], [-1, X.shape[1]]),
                y: classwiseXTest.slice([0,X.shape[1]], [-1, -1])
              });

  return retVal;
}

function checkAccuracy(x, trueY, fn) {
  // predict the y using fn

  const xArray = x.arraySync();

  let predY = tf.tensor([]);
  for (let i = 0; i < xArray.length; i++) {
    const currX = x.slice([i, 0], [1, -1]);
    predY = predY.concat(fn(currX));
  }

  // accuracy truePositive/ total
  return tf.sum(tf.sub(trueY, predY)).div(tf.sum(trueY));
}

/**
 * 
 * @param {object} oneHotTensor Tensor must be of Size NxM where, M = no. of classes N = no. of data points
 */
function oneHot2Class(oneHotTensor){
  return oneHotTensor.matMul( tf.linspace(0, oneHotTensor.shape[1]-1, oneHotTensor.shape[1]).expandDims(1) )
}

/**
 * 
 * @param {object} classTensor Tensor must be of Size NxM where, M = no. of classes N = no. of data points
 */
function class2OneHot(classTensor){

   const nClasses = tf.max(classTensor);

   let oneHotTensor = tf.tensor([]);
   for(let i=0;i< nClasses;i++){

      const thCenter  = tf.sub( i,( classTensor ) ).pow(2);
      const cClass    = tf.sub(1, tf.clipByValue(tf.mul(thCenter, 10000000 ), 0, 1 ));
   
      if( i === 0){
        oneHot2Class = cClass;

        continue;
      }
      oneHotTensor = oneHot2Class.concat(cClass, axis=1);

   }

   return oneHotTensor;

}


/**
 * 
 * @param { object } tensor array.
 */
function tfdet(x) {
  // NOTE: currently it only works for 2x2 input 

  // if (  x.shape[0] > 2 )
  //     throw new Error('invalid input! \n input must be of size 2x2 but given '+ x.shape[0]+' x '+x.shape[1]);

  if (  x.shape[0] > 2 ){
    const {0:Q,1:R} = tf.linalg.qr(x);

    let det = tf.tensor(0);
    // multiply the diagonal of R matrix
    for(let i=0;i<x.shape[0];i++){
        det = tf.abs( det.add( x.slice([i, i],[1, 1]) ) );
    }

    return det;
  }


  const tensorArray = x.arraySync();

  return tf.tensor(tensorArray[0][0]*tensorArray[1][1] - tensorArray[0][1]*tensorArray[1][0]);
}


function pred2Class(predTensor, threshold=0.5, oneHot=true){

  const thCenter  = tf.sub( predTensor,( threshold ) );
  const predClass = tf.pow( tf.clipByValue(tf.mul(thCenter, 10000000 ), 0, 1 ), 1 );

  if (oneHot){

    return class2OneHot(predClass);

  }
  return predClass;

}

/**
 * 
 * @param {Number} index index
 * @param {Array} shape shape of the tensor
 * @param {Number} size total number of values in a tensor
 * 
 * @description given the index number of a tensor, this function coverts that index number to tensor's coordinates
 * 
 * @example 
 * 
 * const tensor = 
    [
      [
        [0.3,0.5,0.2],
        [0.1,0.1,0.8]
      ],
      [
        [0.9,0.05,0.05],
        [0.2,0.7,0.1]
      ]
    ];

    const index = 5; // lets say, we need to find the coords of '0.8' whose index is 5
    const tensorShape = [2, 2, 3];
    const tensorSize = 2*2*3;

    const coords = index2Coords(index, tensorShape, tensorSize );
    console.log(coords); // > [0, 1, 2]
 */
function index2Coords(index, shape, size){

    size = size || shape.reduce((accumulator,currentValue)=> accumulator*currentValue, 1);

    const coords = [];

    let oldFac = size;
    for(let i=0;i<shape.length -1;i++){
        const cFac = (oldFac/shape[i]);
        const cCoords = Math.floor(  (index % oldFac)/cFac );
        coords.push(cCoords);
        oldFac = cFac;
    }
    
    coords.push(index%shape[shape.length-1]);
    
    return coords;
}

/**
 * 
 * @param {Array} shape shape of a tensor
 * @description given the shape of the tensor, this function generates all the coordinates for all the values inside the tensor.
 * 
 * @example 
 * const tensor = 
    [
      [
        [0.3,0.5,0.2],
        [0.1,0.1,0.8]
      ],
      [
        [0.9,0.05,0.05],
        [0.2,0.7,0.1]
      ]
    ];

    const tensorShape = [2, 2, 3];
    const coordsArray = ndIndex(tensorShape)

    console.log(coordsArray); 
    // > [ 0, 0, 0 ]
    // > [ 0, 0, 1 ]
    // > [ 0, 0, 2 ]
    // > [ 0, 1, 0 ]
    // > [ 0, 1, 1 ]
    // > [ 0, 1, 2 ]
    // > [ 1, 0, 0 ]
    // > [ 1, 0, 1 ]
    // > [ 1, 0, 2 ]
    // > [ 1, 1, 0 ]
    // > [ 1, 1, 1 ]
    // > [ 1, 1, 2 ]

 * 
 */
function ndIndex(shape){

    const size = shape.reduce((accumulator,currentValue)=> accumulator*currentValue, 1);
    const coordsArray = [];
     for(let i=0;i< size;i++){
         const currCoords = index2Coords(i,shape);
         coordsArray.push(currCoords);
     }

     return coordsArray;
}

/**
 * 
 * @param {tf.tensor} tensor 
 * @param {Number} number
 *
 * @description converts the nan values in the given tensor to a specified number
 */
function tfNan2Num(tensor, number=0){
    return tf.tensor(tensorMap(tensor.arraySync(), tensor.shape, (n)=>{if(isNaN(n)){return number;}return n;}).tensor);
}


/**
 * 
 * @param {Array} tensor A multi-dimensional array
 * @param {Array} shape shape of our tensor
 * @param {function} func 
 * @param {Number} lastIndex 
 * @param {Array} indexArray 
 * 
 * @description given a multi-dimensional array, this function recusively applies the given function to each values of this tensor and returns the modified multi-dim array 
 */
function tensorMap(tensor, shape, func=(n,i, d)=>{/**console.log(n,i,d); */ return n}, index=0){

    const len = tensor.length;

    for(let i=0;i<len;i++){
      // indexNum +=1;
        if(!(tensor[i][0])){
            tensor[i] = func(tensor[i], index2Coords(index, shape));
            index++;
        }
        else{
            const retVal = tensorMap(tensor[i], shape, func, index);
            tensor[i] = retVal.tensor; //[0];
            index = retVal.index
        }
    }

    return {tensor: tensor,index: index}; // TODO: understand why we can't just return the tensor array. by using chrom dev tools
}

/**
 * 
 * @param {Array} coord coordinate of the tensor
 * @param {Array} shape shape of the tensor
 * 
 * @summary this function simply converts a coordinate of multi-dim tensor into its corresponding index using shape information.
 */
function coord2Index(coord,shape){

    const size = shape.reduce((accumulator,currentValue)=> accumulator*currentValue, 1);

    let index = 0;
    let divSum = shape[0];
    for(let i = 0;i<shape.length-1;i++){
      index += (size/divSum)*coord[i];
      divSum += shape[i];
    }

    return index+coord[coord.length -1];

}


/**
 * 
 * @param {tf.tensor} inputTensor
 * @param {Array, Number} dim which dimension we want to delete along a specified axis (could be an array)
 * @param {Number} axis along which axis we want to delete
 * 
 * @summary deletes the specified dimensions along the specified axis
 * @example
 * 
 * const myTensor = tf.tensor([
    [
        [0.3, 0.5, 0.2], [0.1, 0.1, 0.8]
    ], [
        [0.9, 0.05, 0.05], [0.2, 0.7, 0.1]
    ]
  ]);
 * let modifiedTensor = await tfDeleteAsync(myTensor, dim=1, axis=1);
 * modifiedTensor.print();
  //>    [ [[0.3, 0.5 , 0.2 ],],
  //
  //   [[0.9, 0.05, 0.05],]]

 * modifiedTensor = await tfDeleteAsync(myTensor, dim=[0, 2], axis=2);
 * modifiedTensor.print();
  //>  [[[0.3, 0.2 ],
  //    [0.1, 0.8 ]],
  //
  //   [[0.9, 0.05],
  //    [0.2, 0.1 ]]]

 * modifiedTensor = await tfDeleteAsync(myTensor, dim=[0, 2], axis=2);
 * modifiedTensor.print();
  // >  [[[0.5 ],
   //   [0.1 ]],
   //
   //  [[0.05],
   //   [0.7 ]]]
   
 * @return returns a promise of modified tensor
 */
async function tfDeleteAsync(inputTensor, dim=0, axis=0){
// NOTE: currently, it only works for aixs=0;

  dim = ((typeof dim) !== "number")?dim: [dim];

  const shape = inputTensor.shape;

  const mask = tf.ones([1, shape[axis]]).flatten().arraySync();
  for(let i=0;i< dim.length;i++){
    if (dim[i] < shape[axis])
      mask[dim[i]] = 0;
  }
  const tensorMask = tf.tensor1d(mask, 'bool');

  return tf.booleanMaskAsync(inputTensor, tensorMask, axis) ;
}


function tfDeleteSync(inputTensor, dim=0, axis=0){
// NOTE: currently, it only works for aixs=0;

  dim = ((typeof dim) !== "number")?dim: [dim];

  const shape = inputTensor.shape;

  const mask = tf.ones([1, shape[axis]]).flatten().arraySync();
  for(let i=0;i< dim.length;i++){
    if (dim[i] < shape[axis])
      mask[dim[i]] = 0;
  }

  const tensorMask = tf.tensor1d(mask, 'bool');

  let output = 0;
  async function getBooleanMask() {

    // wait until the promise returns us a value
    output = await tf.booleanMaskAsync(inputTensor, tensorMask, axis) ;
  
    // "Now it's done!"
    return output
  };
  return getBooleanMask();

  // const output = await tf.booleanMaskAsync(inputTensor, tensorMask, axis) ;

  // return output;
}

/**
 * 
 * @param {tf.tensor} matrix input 2d-Tensor
 * 
 * @description given a 2d-tensor(matrix) the function returns the determinant of the given matrix
 */
function tfDet(tensor){
  // based on this article: https://integratedmlai.com/find-the-determinant-of-a-matrix-with-pure-python-without-numpy-or-scipy/

  if (tensor.shape.length > 2)throw new Error('tfDet only support 2d-tensors');

  // if the matrix is singular then the determinant is 0
  if(tensor.shape[0] !== tensor.shape[1])return 0;
 
  const n = tensor.shape[0];

  const Matrix = tensor.arraySync();

  for(let i=0;i< n;i++){
    for(let j=i+1;j<n;j++){

      // id diagonal is zero then change it to a slight non-zero value so that we don't have to div by zero in future calculation
      if(Matrix[i][i] === 0){
        Matrix[i][i] = 1.0e-18;
      }

      const currRowFac = Matrix[j][i]/Matrix[i][i];

      for(let k=0; k<n;k++){
        Matrix[j][k] = Matrix[j][k] - currRowFac * Matrix[i][k];
      }

    }
  }

  let determinant = 1.0;

  for(let i=0;i<n;i++){
    determinant *= Matrix[i][i]
  }

  return tf.tensor(determinant);
}


function multivariateGaussian(mean=tf.zeros([2,1]),covariance=tf.zeros([2,2])){


  if (!mean.shape || !(covariance.shape))
    throw new Error('mean and variance must be a tf.tensor object')

  this.setMean = function(newMean){
    mean = newMean;
  }

  this.setVariance = function(newCovarianceMatrix){
    covariance = newCovarianceMatrix;
  }

  this.getMean = function(){
    return mean;
  }
  this.getVariance = function(){
    return covariance;
  }

  this.getProbability = function(x){


    let k = covariance.shape[0];
    let det = tfDet(covariance).flatten().arraySync()[0];
    let covInv = tfpinv(covariance);

    let fac = 1/( ((2*Math.PI)**(k) * det )**(1/2) );

    let meanCenteredData = x.sub(mean);
    // let prob = tf.exp( meanCenteredData.matMul(covInv).matMul(meanCenteredData.transpose()));

    let tileArray = (new Array(x.shape.length + 1)).fill(1)
    tileArray[0] = x.shape[0];

    let prob = tf.exp( meanCenteredData.expandDims().reshape([x.shape[0],1 , x.shape[1]]).matMul(covInv.expandDims().tile(tileArray)).matMul(meanCenteredData.expandDims().reshape([x.shape[0],x.shape[1], 1]).mul(-1/2)).squeeze());

    return prob.mul(fac);
  }

  this.getSamples = function(sampleSize){
    // return the samples generated from this multivariate gaussian distribution

    const sphericalGaussianSamples = tf.randomNormal([sampleSize, mean.shape[0]]);

    const { eigenVectors : covEignVecs, eigenValues :covEignVals} = tfEigen_R(covariance);

    let gaussianSamples = covEignVals.pow(1/2).mul(covEignVecs).matMul(sphericalGaussianSamples.transpose()).transpose();

    return gaussianSamples.add(mean);

  }


}


function tfEigen_R(tensor){

  let matrix = tensor.arraySync();
  matrix = nd.array(matrix);

  const eigVecs = JSON.parse( nd.la.eigen(matrix)[1].toString() );
  const eigVals = JSON.parse( nd.la.eigen(matrix)[0].toString() );

  return {eigenVectors: tf.tensor(eigVecs), eigenValues: tf.tensor(eigVals)};
}


/**
 * 
 * @param {tf.tensor} tensor input tf.tensor object
 * @param {number} epsilon convergence criterion
 * @param {number} maxItrs maximum allowed iteration of power method
 * 
 * @description given a tensor, this function return the eigenVectors and eigenVals of the matrix using power Iteration method
 */
function tfEigen(tensor, epsilon=.0001, maxItrs=10000){

  function shiftingRedirection(M, eigenValue, eigenVector){
   /* 
    Apply shifting redirection to the matrix to compute next eigenpair: M = M-lambda v
  */

    return (M.sub(eigenValue.mul(tf.matMul(eigenVector.transpose(), eigenVector))));
  }

  function powerMethod(M, epsilon=0.0001, maxItrs=10000){


    // initialize
    let eigenVecArray = (new Array(maxItrs)).fill(null);
    eigenVecArray[0] = tf.randomNormal([M.shape[0], 1])

    eigenVecArray[1] =  tf.matMul(M, eigenVecArray[0]).div(tf.norm(tf.matMul(M, eigenVecArray[0])));

    let count = 1;

    while(   ((tf.norm(eigenVecArray[count].sub(eigenVecArray[count-1])).flatten().arraySync()[0]) > epsilon) && (count < maxItrs)){

      // Computing eigenvector

      eigenVecArray[count+1] = tf.matMul(M, eigenVecArray[count]).div(tf.norm(tf.matMul(M, eigenVecArray[count])));
      count++;

    }

    // Compute eigenValue
    const  eigenValue = tf.matMul(tf.matMul(eigenVecArray[count].transpose(), M), eigenVecArray[count]);

    return {eigenVec: eigenVecArray[count], eigenVal: eigenValue}

  }

  function eigenPairs(M, epsilon= 0.00001, maxItrs = 100){

    // initialize
    let eigenVectors = (new Array(M.shape[0])).fill(null);
    let eigenValues = tf.zeros(M.shape).arraySync();
  
    for(let i=0;i< M.shape[0]; i++){
      const {  eigenVec : currEigenVec ,  eigenVal : currEigenVal } = powerMethod(M, epsilon, maxItrs);

      eigenVectors[i] = currEigenVec.flatten().arraySync();
      eigenValues[i][i]  = currEigenVal.flatten().arraySync()[0];

    // remove the currently calculated eigen vector direction from the original matrix so that it doesn't get recalculated again
      M = shiftingRedirection(M, currEigenVec, currEigenVal);
    }

    return {eigenVectors: tf.tensor(eigenVectors), eigenValues: tf.tensor(eigenValues)};
  }


  if (tensor.shape.length > 2)
    throw new Error('input must be a 2-dimensional tensor(a.k.a matrix) given a tensor of shape: '+tensor.shape);

  if (( tensor.shape[0] != tensor.shape[1]))
    throw new Error('input must be a square matrix, given a matrix of size: '+ tensor.shape)


  return eigenPairs(tensor,epsilon, maxItrs)

}


// a template for quickly creating a d3 viz which can be used as input space visualization
function inputViz(divContainer, 
                       svgSettings={width: 500, 
                                    height: 500, 
                                    margin: {top: 0, right: 0, bottom: 0, left: 0},
                                    rangeX:{min: -10,max: 10}, 
                                    rangeY:{min: -10,max: 10}, 
                                    gridIntervel: 8,
                                    isGrid: true,
                                    isAxisLine: true
                                  }, eventHandlers={onClick: ()=>{}, onDrag: ()=>{}}){


  let components = {};
  // const svgIds = [];

  this.getComponents = () =>{ return components}

  // this.getSvgId = () =>{return }
   function init(){
    svgSettings = {width: svgSettings.width || 500, 
                                    height: svgSettings.height || 500, 
                                    margin: {top: (svgSettings.margin)? svgSettings.margin.top || 40 : 40 ,
                                             right: (svgSettings.margin)? svgSettings.margin.right ||  40 : 40 , 
                                             bottom: (svgSettings.margin)? svgSettings.margin.bottom || 40 : 40, 
                                             left: (svgSettings.margin)? svgSettings.margin.left || 40 : 40 },
                                    rangeX: svgSettings.rangeX || {min: -10, max: 10},
                                    rangeY: svgSettings.rangeY || {min: -10, max: 10},
                                    gridIntervel: svgSettings.gridIntervel || 8,
                                    isGrid: (svgSettings.isGrid === undefined)? true : svgSettings.isGrid  ,
                                    isAxisLine: (svgSettings.isAxisLine === undefined)? true : svgSettings.isAxisLine  ,
                                  }

                                    console.log(svgSettings)
    
    // range of the plot
    const range = {
                   x : {min: (svgSettings.rangeX.min === undefined)?  5 : svgSettings.rangeX.min, max: (svgSettings.rangeX.max === undefined)?  5 : svgSettings.rangeX.max},
                   y : {min: (svgSettings.rangeY.min === undefined)?  -5: svgSettings.rangeY.min, max: (svgSettings.rangeY.max === undefined)?  -5: svgSettings.rangeY.max}
                  }

                   console.log(typeof divContainer)
    // append the svg object
    let svgOriginal = ( ((typeof divContainer) === 'object' )? divContainer : d3.select(divContainer) )
      .append("svg")
      .attr('id', 'svgContainer')
        .attr("width", svgSettings.width + svgSettings.margin.left + svgSettings.margin.right)
        .attr("height", svgSettings.height + svgSettings.margin.top + svgSettings.margin.bottom)
        .on('click', eventHandlers.onClick)
     
     let svg =  svgOriginal
      .append("g")
        .attr("transform",
              "translate(" + svgSettings.margin.left + "," + svgSettings.margin.top + ")")

        // console.log(svg)

    let beforeGridSpace = svg.append('g').attr('id', 'beforeGrid');




    // Add X axis
    let x = d3.scaleLinear()
      .domain([range.x.min, range.x.max])
      .range([ 0, svgSettings.width ]);
      
    // Add Y axis
    let y = d3.scaleLinear()
      .domain([range.y.min, range.y.max])
      .range([ svgSettings.height, 0]);

    // converting the pixel coordinate back to the desired range2
    let xInv = d3.scaleLinear()
      .domain([ 0, svgSettings.width ])
      .range([range.x.min, range.x.max]);

    let yInv = d3.scaleLinear()
      .domain([ svgSettings.height, 0])
      .range([range.y.min, range.y.max]);


    let gridIntervelsX = tf.linspace(range.x.min+1, range.x.max-1, svgSettings.gridIntervel).flatten().arraySync();
    let gridIntervelsY = tf.linspace(range.y.min+1, range.y.max-1, svgSettings.gridIntervel).flatten().arraySync();

    var lineGenerator = d3.line();

    if(svgSettings.isGrid){

      // vertical grid lines 
      svg.append('g')
        .selectAll('path')
        .data(gridIntervelsX)
        .enter()
        .append('path')
        .attr( 'd', function(d) {return lineGenerator([[x(d),y(range.y.min)],[x(d),y(range.y.max)]])} )
        .style('stroke', "gray")
        .attr('opacity', 0.5)

      // horizontal grid lines 
      svg.append('g')
        .selectAll('path')
        .data(gridIntervelsY)
        .enter()
        .append('path')
        .attr( 'd', function(d) {return lineGenerator([[x(range.x.min),y(d)],[x(range.x.max),y(d)]])} )
        .style('stroke', "gray")
        .attr('opacity', 0.5)

    }

    let afterGridSpace = svg.append('g').attr('id', 'afterGrid');

    // create frame so that even if the elements in the 'spaces' (like in beforeGridSpace and afterGridSpace) overflows, this doesn't overlap with our axis scales

   const frame = svg.append('g').attr('id', 'frame');

   frame
   .append('rect')
   .attr('transform', `translate(${-svgSettings.margin.left}, ${-svgSettings.margin.top})`)
   .attr('width', svgSettings.width + svgSettings.margin.left + svgSettings.margin.right)
   .attr('height',svgSettings.margin.top)
  //  .attr('fill', 'white');

   frame
   .append('rect')
   .attr('transform', `translate(${-svgSettings.margin.left}, ${0})`)
   .attr('width', svgSettings.margin.left)
   .attr('height',svgSettings.height + svgSettings.margin.bottom)
  //  .attr('fill', 'blackkk');

   frame
   .append('rect')
   .attr('transform', `translate(${0},${svgSettings.height}) `)
   .attr('width', svgSettings.width)
   .attr('height',svgSettings.margin.bottom)
  //  .attr('fill', 'white');

   frame
   .append('rect')
   .attr('transform', `translate(${svgSettings.width},${0}) `)
   .attr('width', svgSettings.margin.right)
   .attr('height',svgSettings.height + svgSettings.margin.right)
  //  .attr('fill', 'white');

    svg.append("g")
      .attr("transform", "translate(0," + svgSettings.height + ")")
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));
      
    const originAxis = svg.append('g').attr('class', 'originAxis')

    if(svgSettings.isAxisLine){

      // origin x-axis
      originAxis
        .append('path')
        .attr( 'd', lineGenerator([[x(range.x.min),y(0)],[x(range.x.max),y(0)]]) )
        .attr('stroke-width', 3)
        .attr('opacity', 0.5)
        .attr('stroke', 'blue');

      // origin y-axis
      originAxis
        .append('path')
        .attr( 'd', lineGenerator([[x(0),y(range.y.min)],[x(0),y(range.y.max)]]) )
        .attr('stroke-width', 3)
        .attr('opacity', 0.5)
        .attr('stroke', 'red');



    }

        // save all the components for future use...
        components = {
          svg, svgSettings, originAxis, conversionFns: {x,y,xInv,yInv}, spaces: {beforeGridSpace, afterGridSpace}, frame
        }
  }

  init( );

// return this;

}




/**
 * inputViz(divContainerName | divElement ,  svgSettings={width: 500, height: 500, 
 *                                           rangeX:[-10, 10], 
 *                                           rangeY: [-10, 10], })
 * 
 * return svg;
 * 
 *  compoents := originAxis, ConversionFns={x, y, xInv, yInv},
 */