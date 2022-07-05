let utils = {
    permArray: function (n) {
        // generate permutation of the array of (1:n) numbers.
        // let tmpArr = (function(n){let arr = []; for(let i=0;i<n;i++){arr.push(i);} return arr;}(n));
        let shuffedArr = new Array(n);
        let tmpArr = (function (n) {
            let arr = []; for (let i = 0; i < n; i++) {
                arr.push(i);
            } return arr;
        }(n));
        for (let i = 0; i < n; i++) {
            let genIndex = Math.floor(Math.random() * n);
            while (typeof tmpArr[genIndex] !== "number") {
                genIndex = Math.floor(Math.random() * n);
            }
            shuffedArr[i] = genIndex;
            tmpArr[genIndex] = null;
            // tmpArr.pop(genIndex);
        }
        return shuffedArr;
    },
    genBootStrapSample: function (x, indexArr = (function (n) {
        let arr; for (let i = 0; i < n; i++) {
            arr.push(i);
        } return arr;
    }(x.length))) {
        // console.log( ` x: ${x} \n \n indexArr : ${indexArr}` ) ;
        let bootstrapX = [];
        for (let i = 0; i < indexArr.length; i++) {
            bootstrapX.push(x[indexArr[i]]);
        }
        ;
        // console.log(bootstrapX);
        return bootstrapX;
    },
    getBootstrapSamples: function (arr) {
        /* generate boot strap samples from the given data. */
        let genIndex = this.permArray(arr.length); // generate a random permutation instance of Index.
        return this.genBootStrapSample(arr, genIndex);
    },
        map2Array: function (arr, mapArr) {
        // put nums in arr into mapArr bins. 
        // console.log("mapArr: ",mapArr,"arr: ",arr);
        // ? Should address the edge case i.e, when we have y.len > x.len and max(y) > max(x{which is our labels}) 
        // ? or is it addressed by chart.js itself.
        const myArr = new Array(mapArr.length);
        myArr.push(Infinity);
        for (let i = 0; i < mapArr.length; i++) {
            myArr[i] = null;
        }
        for (let j = 0; j < arr.length; j++) {
            let mapIndex = 1 * (myArr.length - 1); // if the value is larger then max(mapArr) 
            // finding appropriate index.
            for (let i = 0; i < myArr.length; i++) {
                if (mapArr[i] > arr[j]) {
                    // console.log("YES")
                    // ( Math.abs(mapArr[i])-Math.abs(arr[j]) ) < .001 
                    mapIndex = ((i - 1) >= 0) ? i - 1 : 0; // if this value is smallest then min(mapArr) 
                    break;
                }
            }
            myArr[mapIndex] = arr[j];
        }
        return myArr;
    },
    relativeMap: function (arrA, arrA_prime, arrB) {
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
            if (idxInArrA !== -1)
                newArrA[idxInArrA] = arrB[i];
        }
        return newArrA;
    },

    prepro4labels: function(labels,x,y){
        // map x to labels(of our chart) and then put y in place of the new mappedX which creates mapped Y.
    
        const mappedX = this.map2Array( (x) , labels );
        const mappedY = this.relativeMap(
                                    mappedX,
                                    x,
                                    y
                                    );
        return mappedY;
    },

    genSampleCurves: function(meanArr,stdevArr){

    let newMeanArr  = tf.tensor([]);
    for(let i = 0;i<meanArr.length;i++){
        console.log(meanArr[i],stdevArr[i],tf.randomNormal([1,],meanArr[i],stdevArr[i]).print())
        // newMeanArr.concat([0.1])
        newMeanArr = newMeanArr.concat(tf.randomNormal([1,],meanArr[i],stdevArr[i]));
    }

    console.log("meanmeanArr: ",newMeanArr.print())
    return newMeanArr.flatten().arraySync();

}


};


/* color schemes taken from :- https://codepen.io/ruchern/pen/OgJqvr */
let darkModeCols = {
	red:   (alpha = 1)=> `rgba(255, 99, 132,${alpha})`,
	orange:(alpha = 1)=> `rgba(255, 159, 64,${alpha})`,
	yellow:(alpha = 1)=> `rgba(255, 205, 86,${alpha})`,
	green: (alpha = 1)=> `rgba(75, 192, 192,${alpha})`,
	blue:  (alpha = 1)=> `rgba(54, 162, 235,${alpha})`,
	purple:(alpha = 1)=> `rgba(153, 102, 255,${alpha})`,
    grey:  (alpha = 1)=> `rgba(231,233,237,${alpha})`,
    magenta: (alpha = 1) =>`rgba(255,0,255, ${alpha})`,
    violet: (alpha = 1) =>`rgba(255,0,255, ${alpha})`
};


function wait(ms)
{
var d = new Date();
var d2 = null;
do { d2 = new Date(); }
while(d2-d < ms);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}