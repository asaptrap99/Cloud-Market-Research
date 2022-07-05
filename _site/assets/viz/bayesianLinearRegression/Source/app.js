const viz = document.getElementById('cover-viz');
var cvx = document.createElement('canvas')
console.log("aksdjf")

viz.appendChild(cvx)

viz.style.backgroundColor= '#303141';
cvx.style.backgroundColor= 'rgb(1, 3, 28)';


const nSamples = 15;
const ntestSamples = 10;
const maxDegree = 10;  // maximum degree of polynomial we can use.

/* Generating Synthetic Data:- */
const trainX = tf.linspace(0.1,1.0, nSamples).expandDims(1); // returns a tf.tensor
const noisefactor = 0.0;
const trainY = tf.add(tf.sin(trainX.mul(tf.scalar(2 * Math.PI))), tf.mul(tf.scalar(noisefactor), tf.truncatedNormal(trainX.shape))); //sin(2*pi*x) + e (some noise) bcuz its an emperical distribution. 
const testX = tf.linspace(-0.3, 1.3, ntestSamples).expandDims(1);
const testY = tf.sin(testX.mul(tf.scalar(2 * Math.PI))); //sin(2*pi*x)

/* Specifying Range for our Chart */
const RangeMin = { x: Math.min(trainX.min().flatten().arraySync()[0],testX.min().flatten().arraySync()[0]),
                   y: Math.min(trainY.min().flatten().arraySync()[0],testY.min().flatten().arraySync()[0])
                 };

const RangeMax = { x: Math.max(trainX.max().flatten().arraySync()[0],testX.max().flatten().arraySync()[0]),
                   y: Math.max(trainY.max().flatten().arraySync()[0],testY.max().flatten().arraySync()[0])
                 };


/* parameters for visualization */
let degree = 8;
let dSize  = 1*nSamples; // no. of samples we use to calculate our curve.

/* generate BootStrap training data of full length by shuffling the indexes. */
const permIndexArr = utils.permArray(trainX.flatten().shape[0]);

// console.log(permIndexArr);
const bts_trainX = tf.tensor(utils.genBootStrapSample(trainX.flatten().arraySync(),permIndexArr)).reshape(trainX.shape);
const bts_trainY = tf.tensor(utils.genBootStrapSample(trainY.flatten().arraySync(),permIndexArr)).reshape(trainY.shape);

// /* no change in permutation. */
// const bts_trainX = trainX;
// const bts_trainY = trainY;

/* Calculating our predictions using Baysian Curve Fitting method with polynomial kernel  */
let {IncMeanArr: meanArr,IncStdevArr: stdevArr}  = BayesianCurveFitting(bts_trainX,bts_trainY,testX,testY,degree);

/* if you want to shuffle the test X then, uncomment this*/
// permIndexArr = utils.permArray(testX.flatten().shape[0]);
// const bts_testX = tf.tensor(utils.genBootStrapSample(testX.flatten().arraySync(),permIndexArr)).reshape(testX.shape);
// const bts_testY = tf.tensor(utils.genBootStrapSample(testY.flatten().arraySync(),permIndexArr)).reshape(testY.shape);
const alpha = 5e-3;
const beta = 11.1;

const lbf = LBF(trainX,trainY,testX,testY).useBasisFn("polynomial",{degree});
const {beta: newBeta,alpha: newAlpha} = lbf.evidenceMaximization(trainX,trainY,5e-3,11.1111,true);

const {y: newMeanArr} = lbf.train( 0.0000+ 0, 11.5 + 0).test();
// const {y: newMeanArr2} = BCF(trainX,trainY,testX,testY).useBasisFn("polynomial",{degree}).train().test();

const SampleY = LBF(trainX,trainY,testX,testY).useBasisFn("polynomial",{degree}).train(alpha,beta).genY(2);
 
// const gPredictedY = LBF(trainX.slice(0,-1),trainY.slice(0,-1),testX,testY)
//                         .useBasisFn("gaussian",{nGaussians: 15})
//                         .train(alpha,beta).test();

console.log("newMean: ",newMeanArr);

/* Always, use the sorted array in chart.js*/
const Xarr = tf.linspace(RangeMin.x,RangeMax.x,100).flatten().arraySync() ;
const XarrDisp = Xarr.map((a) => a.toFixed(2));  // for display purpose only.

/* here, we first map our trainX into our chartScaleLabels i.e, putting values of trainX inside the correct bins
and then we map our trainY to mappedTrainX according to trainX. (see utils.relativeMap for more info.)
*/
const mappedTrainY = utils.prepro4labels(Xarr,
                                     trainX.flatten().arraySync(),
                                     trainY.flatten().arraySync());

const mappedTestY = utils.prepro4labels(Xarr,
                                        testX.flatten().arraySync(),
                                        testY.flatten().arraySync());



/* visualization using Chart.js */


/* changing the color of gridLines */
Chart.defaults.scale.gridLines.color = `rgba(255,255,255,0.04)`;


console.log('canvas: ', cvx);
let ctx = cvx.getContext("2d");
let myChart = new Chart(ctx, {
    data: {
        labels: XarrDisp,
        xAxisID: "tthis is c",
        yAxisID: "tths c",
        // type: 'line',
        showLines: true,
        datasets: [{
            // for training pts. (dynamic)
            type: 'scatter',
            label: '  Training pts',
            spanGaps: false,
            showLines: false,
            data: mappedTrainY, 
            backgroundColor: 
                darkModeCols.green(),
            borderColor:
                darkModeCols.green(),
            radius: 12,
            fill:false
        },
        {
            // for testing pts. (ground truth)
            type: 'line',
            label: 'True Y',
            spanGaps: true,
            data: mappedTestY,
            backgroundColor: 
             'rgba(54, 162, 235, 0.2)',
            borderColor:
            darkModeCols.blue(.3),
            borderWidth: 0,
            radius: 0,
            showLine: true,
            fill: false
        },

        {
            // for stdev + 1
            type: 'line',
            label: 'stdev',
            spanGaps: true,
            data: [],
            backgroundColor: 
             ` rgba(${Chart.helpers.color("pink").values.rgb},.3)`,
            borderColor:
                darkModeCols.red(.5),
            borderDash: [5, 5],
            borderWidth: 2,
            radius : 0,
            showLine: true,
            fill:false
        },

        {
            // for stdev - 1
            type: 'line',
            label: 'Stdev',
            spanGaps: true,
            data: [],
            backgroundColor: 
             ` rgba(${Chart.helpers.color("pink").values.rgb},.3)`,
            borderColor:
                darkModeCols.red(.5),
            borderDash: [5, 5],
            borderWidth: 2,
            radius : 0,
            showLine: true,

            fill:false
        },

        {
            // (computed pts.) {mean}
            type: 'line',
            label: 'Predicted Y',
            spanGaps: true,
            data: [], 
            backgroundColor: 
                document.body.style.backgroundColor || `white`,
            borderColor:
                darkModeCols.red(),
            borderWidth: 3,
            pointRadius: 5,
            

            fill: false
        },
        // {
        //     // (computed pts.) {mean}
        //     type: 'line',
        //     label: 'from LBF pred-Y',
        //     spanGaps: true,
        //     data: utils.prepro4labels(Xarr,testX.flatten().arraySync(),newMeanArr.flatten().arraySync()),
        //     backgroundColor: 
        //         document.body.style.backgroundColor || `white`,
        //     borderColor:
        //         darkModeCols.violet(),
        //     borderWidth: 3,
        //     pointRadius: 5,
            

        //     fill: false
        // },

        // {
        //     // (computed pts.) {mean}
        //     type: 'line',
        //     label: 'New-Predicted Y',
        //     spanGaps: true,
        //     data: []|| utils.prepro4labels(Xarr,testX.flatten().arraySync(),newMeanArr2.flatten().arraySync()), 
        //     backgroundColor: 
        //         document.body.style.backgroundColor || `white`,
        //     borderColor:
        //         darkModeCols.violet(),
        //     borderWidth: 3,
        //     pointRadius: 5,
            

        //     fill: false
        // }
    ]
    },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Bayesian Curve Fitting',
                fontSize: 15
            },
            tooltips: {
                mode: 'index',
                intersect: false,
                filter: function (tooltipItem, data) {
                    /* removing tooltip for both stdev Arrays.*/
                    if (tooltipItem.datasetIndex === 3 || tooltipItem.datasetIndex === 2 ) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            legend: {
                display: true, 
                labels: {
                    filter: function (LegendItem, data) {
                        /* removing stdev +1 Array our from legends*/
                        if (LegendItem.datasetIndex === 3 ){
                            return false;
                        } else {
                            return true;
                        }
                    },
                    usePointStyle:true,
                    padding: 15,
                    boxWidth: 10
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                gridLines: {
                    color: 'rgba(255, 255, 255, 1.0)',
                    lineWidth : 10,
                    display: false
                },
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'x-axis ',
                        fontSize: 5 
                    },
                    ticks: {

                        min: 0,
                        max: 4 

                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'y-axis ',
                        fontSize: 15 
                    },
                    ticks: {

                        min: -1.5,
                        max: 1.5
                    }
                }]
            },
        zoom: {
            // ? What to do with this??
		// Container for pan options
		pan: {
			// Boolean to enable panning
			enabled: true,

			// Panning directions. Remove the appropriate direction to disable
			// Eg. 'y' would only allow panning in the y direction
			mode: 'xy',
			rangeMin: {
				// Format of min pan range depends on scale type
				x: null,
				y: null
			},
			rangeMax: {
				// Format of max pan range depends on scale type
				x: null,
				y: null
			},
			// Function called once panning is completed
			// Useful for dynamic data loading
			onPan: function({chart}) { console.log(`I was panned!!!`); }
		},

		// Container for zoom options
		zoom: {
			// Boolean to enable zooming
			enabled: true,

			// Enable drag-to-zoom behavior
			drag: true,

			// Drag-to-zoom rectangle style can be customized
			// drag: {
			// 	 borderColor: 'rgba(225,225,225,0.3)'
			// 	 borderWidth: 5,
			// 	 backgroundColor: 'rgb(225,225,225)'
			// },

			// Zooming directions. Remove the appropriate direction to disable
			// Eg. 'y' would only allow zooming in the y direction
			mode: 'xy',

			rangeMin: {
				// Format of min zoom range depends on scale type
				x: null,
				y: null
			},
			rangeMax: {
				// Format of max zoom range depends on scale type
				x: null,
				y: null
			},

			// Speed of zoom via mouse wheel
			// (percentage of zoom on a wheel event)
			speed: 0.00,

			// Function called once zooming is completed
			// Useful for dynamic data loading
			onZoom: function({chart}) { console.log(`I was zoomed!!!`); }
		}
    }
        }
});

updateChart();



/* Interactions:- */

const sampleSlider = document.getElementById("myRange"); 
const output = document.getElementById("sSize"); 

const degreeSlider = document.getElementById("newDegree");
const degreeOutput = document.getElementById("degreeTxt");

const reCalcBtn = document.getElementById("reCalculate-btn");


// console.log(document.body.style.backgroundColor );

degreeSlider.oninput = function(){
    
    degree =  Math.floor((this.value/100)*(maxDegree-1))+1;
    // newDegree = 7;
    degreeOutput.innerHTML = degree;

    
}

function reCalculate(){

    console.log(`Calculating Baysian Curve ... \nwith degree: ${degree} `)
    const newBayesianCurveFitting = BayesianCurveFitting(bts_trainX,bts_trainY,testX,testY,degree);

    meanArr  = newBayesianCurveFitting.IncMeanArr;
    stdevArr = newBayesianCurveFitting.IncStdevArr;

    console.log("Finished Recalculating.")

}

function updateChart(){

    /* Display:- */

    /* LBF output :- */

    /* configuring our y-axis outputs according to our labels array */
    const w1 = utils.map2Array( (testX.flatten().arraySync()) , Xarr );
    const w2 = utils.relativeMap(w1,testX.flatten().arraySync(),meanArr[dSize-1]);

    // console.log(w1,w2);
    // console.log(w1,w2,testX.flatten().arraySync(),meanArr[dSize-1].print(),Xarr);
    myChart.data.datasets[4].data = w2;


    /* Displaying Stdev:- */

    // const {p1 : stdevP1 ,m1: stdevM1 } = genArrfromStdev(meanArr[dSize-1],stdevArr[dSize-1])

    const fac = 0.5;
    const stdevP1 =tf.add(
                   tf.mul(tf.scalar(fac) ,
                   tf.sqrt(  tf.tensor( stdevArr[dSize-1] ) ) 
                   ) ,
                   tf.tensor(meanArr[dSize-1])).flatten().arraySync();

    const stdevM1 =tf.add(
                   tf.mul(tf.scalar(-fac) ,
                   tf.sqrt(  tf.tensor( stdevArr[dSize-1] ) ) 
                   ) ,
                   tf.tensor(meanArr[dSize-1])).flatten().arraySync();
    
    const stdevArrP1 = utils.relativeMap(w1,testX.flatten().arraySync(),stdevP1); 
    const stdevArrM1 = utils.relativeMap(w1,testX.flatten().arraySync(),stdevM1); 

    myChart.data.datasets[2].data = stdevArrP1;
    myChart.data.datasets[3].data = stdevArrM1;


    // const NewStdevPts = genArrfromStdev(Yarr,stdevArr[dSize-1].flatten().arraySync());

    // myChart.data.datasets[2].data = utils.map2Array(quickSort( NewStdevPts.p1) , Xarr);
    // myChart.data.datasets[3].data = utils.map2Array(quickSort( NewStdevPts.m1) , Xarr);

    /* Displaying training data */

    // TODO: Make sure all the arrays that are going inside display are sorted accordingly.

    const scatterX = utils.genBootStrapSample(bts_trainX.flatten().arraySync(),tf.linspace(0,dSize-1,dSize).flatten().arraySync());
    const scatterY = utils.genBootStrapSample(bts_trainY.flatten().arraySync(),tf.linspace(0,dSize-1,dSize).flatten().arraySync());

    const w3 = utils.map2Array( scatterX,Xarr);
    const w4 = utils.relativeMap(w3,scatterX,scatterY);

    // console.log(w4);    

    // console.log(scatterX,w4);
    myChart.data.datasets[0].data = w4; 

    // console.log(": ",utils.genBootStrapSample(trainY.flatten().arraySync(),tf.linspace(0,dSize-1,dSize).flatten().arraySync()))
    // console.log(myChart.data.datasets);

    // console.log(forScatter);
    myChart.update();
};

// output.innerHTML = 3;
sampleSlider.oninput = function(){

    dSize = Math.floor((sampleSlider.value/100)*(nSamples-1))+1;
    output.innerHTML = dSize;
   
    updateChart();
}

function darkTheme(chart,chartJSObj) {
    
    if(!Chart){
        console.error("Unspecified Chart Object: user must insert a valid Chart.js Object");
        return false;
    }

    /* private properties:- */
    const myChart = chart;
    const chartObj  = chartJSObj;


    let originalChartObj = Object.assign({},chartObj) ;
    let orignalmyChart   = Object.assign({},myChart) ;

    originalSettings = {
        // collection of all the settings that we are going to be modifying.
        defaultGlobalFontColor : chartObj.defaults.global.defaultFontColor,


    }
    
    this.enable = function(bgCol = `rgb(10,10,25)`,enableDarkPage = true){

        originalSettings.defaultFontColor = chartObj.defaults.global.defaultFontColor;

        /* set default font color to white */
        chartObj.defaults.global.defaultFontColor = "white";



        /* set the background color of myChart taken from:-  https://codepen.io/ruchern/pen/OgJqvr  */
        chartObj.plugins.register({
        beforeDraw: function(chartInstance) {
            var ctx = chartInstance.chart.ctx;
            ctx.fillStyle = bgCol;
            ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
        }
        })

        /* these should be user specified. */

        if(0){

            /* hide stdev lines */
            chart.data.datasets[2].showLine = false;
            chart.data.datasets[3].showLine = false;
        }

        myChart.data.datasets[4].backgroundColor = bgCol;

        myChart.update();

        if(enableDarkPage){
            document.body.style.backgroundColor = bgCol;
            document.body.style.color = "white";
        }
        
        return this; // for chaining methods
    },

    this.disable = function(enableDarkPage = true){
        /* reverting back to the original setting */

        // chartObj = Object.assign({},originalChartObj);

        chartObj.defaults.global.defaultFontColor = originalSettings.defaultFontColor;

        /* Creating Glowing Effect */
        // myChart.chart.ctx.stroke = function(){}

        // myChart.chart.ctx.stroke = function(){
        //     let ctx = myChart.chart.ctx;
        //     let _stroke = ctx.stroke;

        //     ctx.stroke = function() {
        //         ctx.save();
        //         ctx.shadowColor = '';
        //         ctx.shadowBlur  = 0;
        //         ctx.shadowOffsetX = 0;
        //         ctx.shadowOffsetY = 0;
        //         _stroke.apply(this, arguments);
        //         ctx.restore();
        //     };
        // }

        let draw = chartObj.controllers.line.prototype.draw;
        chartObj.controllers.line.prototype = function() {
            var t, e = this.chart, i = this.getMeta(), n = i.data || [], a = e.chartArea, r = n.length, o = 0;
            for (ee(this.getDataset(), e.options) && (t = (i.dataset._model.borderWidth || 0) / 2,
            ut.canvas.clipArea(e.ctx, {
                left: a.left,
                right: a.right,
                top: a.top - t,
                bottom: a.bottom + t
            }),
            i.dataset.draw(),
            ut.canvas.unclipArea(e.ctx)); o < r; ++o)
                n[o].draw(a)
        }
        //     draw.apply(this, arguments);
        //     let ctx = this.chart.chart.ctx;
        //     let _stroke = ctx.stroke;

        //     ctx.stroke = function() {
        //         ctx.save();
        //         ctx.shadowColor = '';
        //         ctx.shadowBlur  = 0;
        //         ctx.shadowOffsetX = 0;
        //         ctx.shadowOffsetY = 0;
        //         _stroke.apply(this, arguments);
        //         ctx.restore();
        //     };
        // };


        /* set the background color of myChart taken from:-  https://codepen.io/ruchern/pen/OgJqvr  */
        chartObj.plugins.register({
        beforeDraw: function(chartInstance) {
            var ctx = chartInstance.chart.ctx;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
        }
        })

        myChart.data.datasets[4].backgroundColor = "white";

        if(enableDarkPage || true){
            document.body.style.backgroundColor = "";
            document.body.style.color = "black";
        }

        myChart.update();
        return this;
    }

}


let darktheme = new darkTheme(myChart,Chart);
                       console.log(darktheme);


        

function toggleDarkMode(){
    if (document.body.style.backgroundColor  === ''){
         darktheme.enable();
         
        }else{darktheme.disable();}
    } 

// dark mode is default. 

toggleDarkMode();