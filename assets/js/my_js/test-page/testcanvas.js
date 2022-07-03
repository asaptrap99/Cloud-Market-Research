var canvasDiv = document.getElementById("Canvas1");
var pwidth = canvasDiv.offsetWidth;

function setup(){
    var canvas = createCanvas(pwidth,400);
    canvas.parent('Canvas1')
}

let a = 0;

function draw(){
    // print("sdjf");
    background(300,255*cos(a),255*sin(a));
    a+=.01
    fill(100);
    ellipse(mouseX,mouseY,50);
}


function windowResized() {
  resizeCanvas(canvasDiv.offsetWidth,400);
}