/* Initializing canvases */
let reconImgElem = document.getElementById('reconstructedImg');
const inputImgElem = document.getElementById('inputImg');

/* creating canvas for input image image */
const inpImgCanvas = document.createElement('canvas');
inpImgCanvas.width = inpImgDim.width;
inpImgCanvas.height = inpImgDim.height;

const inpImgCtx = inpImgCanvas.getContext('2d');
inputImgElem.appendChild(inpImgCanvas);


/* creating canvas for reconstructed image */
const reconImgCanvas = document.createElement('canvas');
reconImgCanvas.width = reconImgDim.width;
reconImgCanvas.height = reconImgDim.height;

const reconImgCtx = inpImgCanvas.getContext('2d');
reconImgElem.appendChild(reconImgCanvas)

// this flag will alow the input image to get updated when we get random inputs but 
// when manipulating the latent vector we don't update the input canvas..
let updateInpImgCanvas = 0;






// creating inputViz 
const inputVizObj = new inputViz('#latentSpaceViz', 
   {width: latentSpaceDim.width, 
    height: latentSpaceDim.height, 
    rangeX:{min: -10,max: 10}, 
    rangeY:{min: -10, max: 10}});

// changing the background color of the frame to match the background color

const bgCol = getComputedStyle(document.getElementsByTagName('body')[0]).backgroundColor
inputVizObj.getComponents().frame.attr('fill', bgCol || 'green')


/* Adding latent space point */
let svg = inputVizObj.getComponents().svg;
let scale = {x: inputVizObj.getComponents().conversionFns.x, 
             y:  inputVizObj.getComponents().conversionFns.y};

let scaleInv = {x: inputVizObj.getComponents().conversionFns.xInv, 
             y:  inputVizObj.getComponents().conversionFns.yInv};

svg.append('g').attr('class', 'latentPoint')

let latentPoint = svg.select('.latentPoint')
.append('circle')
.attr('cx', scale.x(0))
.attr('cy', scale.y(0))
.attr('r', 15)
.style('fill', darkModeCols.purple(1))
.call(d3.drag().on('drag', dragmove))

// Define drag beavior
var drag = d3.drag()
    .on("drag", dragmove);

function dragmove(d) {
  var x = d3.event.x;
  var y = d3.event.y;

  updateInpImgCanvas = 0;
//   console.log(x,y)
  d3.select(this)
      .attr('cx', (x))
      .attr('cy', (y))

    
    updateViz([scaleInv.x(x), scaleInv.y(y)])


  
}





// let prevZPoint = [0,0];

// let cCoords = [0,0];

function updateViz(zPoints){

    console.log(zPoints)

    zPoints = tf.tensor(zPoints).expandDims();


    if(!updateInpImgCanvas){
        inpImgCtx.fillStyle = 'black';
        inpImgCtx.fillRect(0,0, inpImgCanvas.width, inpImgCanvas.height)

        updateInpImgCanvas = 0;
    }

    // reconstructing image given the latent vector
    const reconstructedImage = window.AE.getDecoderModel().predict(zPoints);

    let imageTensor =
        // Reshape the image to 28x28 px
        reconstructedImage
        .reshape([28, 28, 1]);

    imageTensor = imageTensor.div(imageTensor.max().sub(imageTensor.min()));

    
    tf.browser.toPixels(tf.image.resizeBilinear(imageTensor, [reconImgDim.width,reconImgDim.height]) , reconImgCanvas);
    // surface1.drawArea.appendChild(canvas);
    reconImgElem.appendChild(reconImgCanvas);

}