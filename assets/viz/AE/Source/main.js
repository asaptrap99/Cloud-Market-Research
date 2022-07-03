// import {MnistData} from '../../dependency/data/mnist_data.js';


const inpImgDim = {width: 350, height: 350};
const reconImgDim = {width: 350, height: 350};
const latentSpaceDim = {width: 300, height: 300};


async function showExamples(n='i d ex', data) {
  // Create a container in the visor
  const surface =
    tfvis.visor().surface({ name: n, tab: 'Input Data'});  

  // Get the examples
  const examples = data;
  const numExamples = 20;
  
  // Create a canvas element to render each example
  for (let i = 0; i < numExamples; i++) {
    const imageTensor = tf.tidy(() => {
      // Reshape the image to 28x28 px
      return examples
        .slice([i, 0], [1, examples.shape[1]])
        .reshape([28, 28, 1]);
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    canvas.style = 'margin: 4px;';
    await tf.browser.toPixels(imageTensor, canvas);
    surface.drawArea.appendChild(canvas);

    imageTensor.dispose();
  }
}

function doPrediction(model, data, testDataSize = 500) {
  const IMAGE_WIDTH = 28;
  const IMAGE_HEIGHT = 28;
  const testData = data.nextTestBatch(testDataSize);
  const testxs = testData.xs.reshape([testDataSize, IMAGE_WIDTH, IMAGE_HEIGHT, 1]);
  const preds = model.predict(testxs);

  return [preds, testxs];
}

async function showAccuracy(model, data) {
  const [preds, labels] = doPrediction(model, data);
  const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds);
  const container = {name: 'Accuracy', tab: 'Evaluation'};
  tfvis.show.perClassAccuracy(container, classAccuracy, classNames);

  labels.dispose();
}

async function showConfusion(model, data) {
  const [preds, labels] = doPrediction(model, data);
  const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds);
  const container = {name: 'Confusion Matrix', tab: 'Evaluation'};
  tfvis.render.confusionMatrix(
      container, {values: confusionMatrix}, classNames);

  labels.dispose();
}


const data = new MnistData();

let predOut, dataOut;

let model = 0;
async function runAE() {  
await data.load();
  // await showExamples('i d n',data.nextTestBatch(20).xs);


  const LEARNING_RATE = .0005;
  const BATCH_SIZE = 100;
  const INITIAL_EPOCH = 0;
  const nEpoch = 1000;

  const AE = new AutoEncoder([28, 28, 1],
    { encoderConvFilters : [32,64,64, 64],
     encoderConvKernelSize : [3,3,3,3],
     encoderConvStrides : [1,2,2,1],
     decoderConvTFilters : [64,64,32,1],
     decoderConvTKernelSize : [3,3,3,3],
     decoderConvTStrides : [1,2,2,1],
     z_dim : 2,
    }
  );

  model = AE.getMyModel();

  // using pre-trained network..
  let savedEncoderModel = await tf.loadLayersModel('./SavedModel/encoder2.json');
  let savedDecoderModel = await tf.loadLayersModel('./SavedModel/decoder2.json');
  let savedMyModel = await tf.loadLayersModel('./SavedModel/MyModel-2.json');
  
  AE.loadWeights(savedEncoderModel.getWeights(), savedDecoderModel.getWeights(), savedMyModel.getWeights());

  console.log("fine");
  
  const TRAIN_DATA_SIZE = 100;
  const trainXs = data.nextTrainBatch(TRAIN_DATA_SIZE).xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]);

  window.AE = AE;
}

document.addEventListener('DOMContentLoaded', runAE);

async function showLatentSpace(AE, data){

  const surface0 =
    tfvis.visor().surface({ name: 'LatentSpace', tab: 'Input Data'});  

  const numExamples = data.shape[0];
  let examples = data;

  examples = examples.reshape([examples.shape[0], 28, 28, 1])

  const zPoints = AE.getEncoderModel().predict(examples)[2];

const myData = zPoints.arraySync().map((a) =>{return { x: a[0], y: a[1]}});

const data2 = {values: myData};


tfvis.render.scatterplot(surface0, data2);


}


async function reconstructingOriginalImage(AE, data){

  const surface0 =
    tfvis.visor().surface({ name: 'original Images', tab: 'Input Data'});  

  // Get the examples
  const numExamples = data.shape[0];
  let examples = data;

  examples = examples.reshape([examples.shape[0], 28, 28, 1])

  const zPoints = AE.getEncoderModel().predict(examples);
  const reconstructedImage = AE.getDecoderModel().predict(zPoints);

  zPoints.print();

  // Create a canvas element to render each example
  for (let i = 0; i < numExamples; i++) {
    const imageTensor = tf.tidy(() => {
      // Reshape the image to 28x28 px
      return examples
        .slice([i, 0], [1, examples.shape[1]])
        .reshape([28, 28, 1]);
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    canvas.style = 'margin: 4px;';
    await tf.browser.toPixels(imageTensor, canvas);
    surface0.drawArea.appendChild(canvas);

    imageTensor.dispose();
  }



  const surface1 =
    tfvis.visor().surface({ name: 'reconstructed Images', tab: 'Input Data'});  




  for (let i = 0; i < numExamples; i++) {
    let imageTensor = tf.tidy(() => {
      // Reshape the image to 28x28 px
      return reconstructedImage
        .slice([i, 0], [1, examples.shape[1]])
        .reshape([28, 28, 1]);
    });

    imageTensor = imageTensor.div(imageTensor.max().sub(imageTensor.min()));

    
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    canvas.style = 'margin: 4px;';
    await tf.browser.toPixels(imageTensor, canvas);
    surface1.drawArea.appendChild(canvas);

    imageTensor.dispose();
  }
}






function rndImg(){

  // console.log('slkdjf', rndImgBtnElem.addEventListener)
  // getting input image:-
  const trainXs = data.nextTrainBatch(1).xs.reshape([1, 28, 28, 1]);

  // TODO: show the input image in the inputImage canvas
    let imageTensor = tf.tidy(() => {
      // Reshape the image to 28x28 px
      return trainXs 
        .slice([0, 0], [1, trainXs.shape[1]])
        .reshape([28, 28, 1]);
    });
    
    imageTensor = imageTensor.div(imageTensor.max().sub(imageTensor.min()));
    tf.browser.toPixels(tf.image.resizeBilinear(imageTensor, [inpImgDim.width,inpImgDim.height]) , inpImgCanvas);
    inputImgElem.appendChild(inpImgCanvas);

    imageTensor.dispose();

    updateInpImgCanvas = 1;

  const zPoints = AE.getEncoderModel().predict(trainXs);

  console.log(zPoints.print())

  cCoords = [scale.x(zPoints.dataSync()[0]), scale.y(zPoints.dataSync()[1])]

  const reconstructedImage = AE.getDecoderModel().predict(zPoints);

  let reconImgTensor = tf.tidy(() => {
    // Reshape the image to 28x28 px
    return reconstructedImage 
      .slice([0, 0], [1, reconstructedImage.shape[1]])
      .reshape([28, 28, 1]);
  });
  
  reconImgTensor = reconImgTensor.div(reconImgTensor.max().sub(reconImgTensor.min()));

  tf.browser.toPixels(tf.image.resizeBilinear(reconImgTensor, [reconImgDim.width,reconImgDim.height]) , reconImgCanvas);
  reconImgElem.appendChild(reconImgCanvas);

  reconImgTensor.dispose();


  latentPoint.attr('cx', cCoords[0]);
  latentPoint.attr('cy', cCoords[1]);
}