function BayesianCurveFitting(trainX,trainY,testX,testY,degree, alpha = 5e-3,beta = 11.1){
    /* NOTE: this function strongly assume that the noise is gaussian. and  unimodel. */

    const nSamples = trainX.shape[0];
    const polyVec  = tf.linspace(0, degree, degree+1).expandDims(1); // array of all the powers 02Degree
    const M = polyVec.shape[0] ; // +1 for the bias term.

    const stdevArr = tf.zeros(trainX.shape).flatten().arraySync();
    const meanArr = stdevArr.slice(0);



    // console.log(nSamples,polyVec,M,nSamples);
    /* sequential curve fitting by taking the trainX samples one by one. */
    for (let i = 0; i < nSamples; i++) {

        /* Array of bootStrap Input samples(trainX) from 0 to i */
        let trainX_02i = trainX.slice(0, i + 1); // x2
        let trainY_02i = trainY.slice(0, i + 1); // t2

        /* here our phi fn is just a simple polynomial */
        const tmp_phiX = trainX_02i.pow(polyVec.transpose());
        const phiX = (function(x){
            /* just replace NaN with 0 otherwise keep it as it is. */

            // return x.where(tf.isNaN(x),tf.zeros(x.shape),x);
                return x.where(tf.isNaN(x),x,tf.zeros(x.shape));
             }( tmp_phiX)).transpose();
            //  console.log(": ",tmp_phiX);
        const w1 = tf.mul(tf.scalar(alpha), tf.eye(M));
        const w2 = tf.mul(tf.scalar(beta), tf.matMul(phiX, phiX.transpose()));
        const S_inv = tf.add(w1, w2); // eqn 1.72 
        const phi_testX = testX.pow(polyVec.transpose()).transpose();


        // if(i === 0)
        //     console.log(phiX.print(),w2.print(),w1.print(),S_inv.print())

        /* initilizing mean and variance */
        const stdevVec = tf.zeros(testX.shape).flatten().arraySync();
        const meanVec  = stdevVec.slice(0);


        /* calculating mean and stdev for each test point from our predictive distribution */
        for (let k = 0; k < testX.shape[0]; k++) {
            const phi_testX_k = phi_testX.transpose().slice(k, 1); // taking each test sample one by one. //dim:- [1,8]
            const a  = tf.mul(tf.scalar(beta), phi_testX_k); // dim [1,8]
            const b1 = tf.matMul(phiX, trainY_02i).flatten().arraySync();
            const b2 = S_inv.arraySync();
            const b  = tf.tensor(gauss(b2, b1)).expandDims(1); // solving system of linear equation using gaussian-elemination.

            if(k === 0 && i ===0)phi_testX.print()
            meanVec[k] = tf.matMul(a, b).flatten().arraySync()[0]; // eqn 1.70

            const c1 = tf.tensor(gauss(S_inv.arraySync(), phi_testX_k.flatten().arraySync())).expandDims(1);
            const c  = tf.matMul(phi_testX_k, c1);

            stdevVec[k] = tf.add(tf.scalar(1 / beta), c).flatten().arraySync()[0]; // eqn 1.71

            // if (i===14)tf.matMul(a,b).print();
        }
        meanArr[i]  = meanVec;
        stdevArr[i] = stdevVec;


    }
    return {
        /*Incremental mean array */
        IncMeanArr: meanArr,
        IncStdevArr: stdevArr,
    };
}



// In practice:-

// APP.js

// // initializing bayesian curve fitting object
// let bcf = BayesianCurveFitting(trainX,trainY,testX,testY);

// // specifying basis fn:-
// bcf.basisfn("polynomial") // or radial/gaussian kernel

// // or being able to use your own basisfn:-
// bcf.basisfn(function(x,params = {power : 2}){
//     // object parameters for this function 
//     const power = params     ;
//     return x**power;
// });

// // by default its batch matrix ops.
// bcf.train().test(testX);
// bcf.test(testX);

// // if you want to train squentially then use this:-

// // with custom callback fn. which runs at every time intervel.
// // using this we can dynamically update the given train/ test X
// bcf.trainSquentially(callbackfn(), /* time intervel */ 100);


// // if only the array is given then it will return the result sequentially.
// bcf.trainSquentially(trainX);


// // a simple polynomial curve fitting
// const bcf = BayesianCurveFitting(trainX,trainY,testX,testY);
// bcf.useBasisFn("polynomial",{degree: 7});
// bcf.setBasisFn("myFn",function(x){return x},2,3,4)
// const predictedY = bcf.train().test(); // batch prediction.


// for BCF Library.js

        // this.evidenceMaximization = function(x,t,alpha_0,beta_0,maxItr,tollerance){
            
        //     const {0:N , 1:M} = x.shape

        //     eigenvalues_0 = 2;

        //     let alpha = alpha_0;
        //     let beta = beta_0;

        //     for(let i=0;i< maxItr ; i++){
        //         beta_pre = beta;
        //         alpha_pre = alpha;
                
        //         eigenvalues = eigenvalues_0 * beta;

        //         const {mean: w_mean,variance: w_variance,precision: w_precision} = this.paramPDF(x,t,alpha,beta);

        //         gamma = np.sum(tf.div(eigenvalues, tf.add(eigenvalues , tf.scalar(alpha))));
        //         alpha = np.div(gamma , np.sum(np.pow(w_mean, 2)));

        //         beta = tf.mul(
        //                       tf.sub(N,gamma) ,
        //                       tf.sum(
        //                              tf.sub(
        //                                     tf.pow(
        //                                             tf.matMul(x,w_mean),
        //                                             2
        //                                            )
        //                                     )
        //                             )
        //                      );

        //         if (( (Math.abs(alpha_pre - alpha)) < tollerance)
        //                                     &&
        //             ( (Math.abs(beta_pre - beta) )  < tollerance))
        //         {
        //             return {alpha,beta};
        //         }
        //     }

        // }