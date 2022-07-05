
 let script1 = document.createElement('script');
script1.type = 'text/javascript';
script1.src = '/assets/js/dependency/d3.js';
 document.getElementsByTagName('head')[0].appendChild(script1);


 let script2 = document.createElement('script');
script2.type = 'text/javascript';
script2.src = '/assets/js/dependency/p5/p5.min.js';
 document.getElementsByTagName('head')[0].appendChild(script2);


 let script3 = document.createElement('script');
script3.type = 'text/javascript';
script3.src = '/assets/js/dependency/plotlyJS/plotly-latest.min.js';
 document.getElementsByTagName('head')[0].appendChild(script3);


 let script4 = document.createElement('script');
script4.type = 'text/javascript';
script4.src = '/assets/js/dependency/ndjs/nd.min.js';
 document.getElementsByTagName('head')[0].appendChild(script4);


 let script5 = document.createElement('script');
script5.type = 'text/javascript';
script5.src = '/assets/js/dependency/lodash.js';
 document.getElementsByTagName('head')[0].appendChild(script5);


 let script6 = document.createElement('script');
script6.type = 'text/javascript';
script6.src = '/assets/js/dependency/utils.js';
 document.getElementsByTagName('head')[0].appendChild(script6);


 let script7 = document.createElement('script');
script7.type = 'text/javascript';
script7.src = 'https://npmcdn.com/chart.js@latest/dist/Chart.bundle.min.js';
 document.getElementsByTagName('head')[0].appendChild(script7);

 let script8 = document.createElement('script');
script8.type = 'text/javascript';
script8.src = '/assets/js/dependency/tensorflowJS/tf.js';
 document.getElementsByTagName('head')[0].appendChild(script8);

 console.log("loaded");