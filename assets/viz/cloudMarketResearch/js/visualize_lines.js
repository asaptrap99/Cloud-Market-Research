var globeRadius = 1000;
var vec3_origin = new THREE.Vector3(0, 0, 0);

function makeConnectionLineGeometry(exporter, importer, value, type) {
	if (exporter.countryName == undefined || importer.countryName == undefined)
		return undefined;

	// console.log("making connection between " + exporter.countryName + " and " + importer.countryName + " with code " + type );

	var distanceBetweenCountryCenter = exporter.center.clone().subSelf(importer.center).length();

	//	how high we want to shoot the curve upwards
	var anchorHeight = globeRadius + distanceBetweenCountryCenter * 0.7;

	//	start of the line
	var start = exporter.center;
	var startUpperAnchor = exporter.center;

	//	end of the line
	var end = importer.center;

	//	midpoint for the curve
	var mid = start.clone().lerpSelf(end, 0.5);
	var midLength = mid.length()
	mid.normalize();
	mid.multiplyScalar(midLength + distanceBetweenCountryCenter * 0.7);

	//	the normal from start to end
	var normal = (new THREE.Vector3()).sub(start, end);
	normal.normalize();
	// console.log('start, mid and normal: ', start, mid, normal)
	window.normal = normal
	window.mid = mid
	window.startPoint = start

	/*				     
				The curve looks like this:
				
				midStartAnchor---- mid ----- midEndAnchor
			  /											  \
			 /											   \
			/												\
	start/anchor 										 end/anchor

		splineCurveA							splineCurveB
	*/

	var distanceHalf = distanceBetweenCountryCenter * 0.5;

	var midStartAnchor = mid.clone().addSelf(normal.clone().multiplyScalar(distanceHalf));
	var startAnchor = midStartAnchor;
	var midEndAnchor = mid.clone().addSelf(normal.clone().multiplyScalar(-distanceHalf));
	var endAnchor = end;
	var startVecMax = start.normalize().multiplyScalar(150)

	//	now make a bezier curve out of the above like so in the diagram
	var splineCurveA = new THREE.CubicBezierCurve3(start, startVecMax, startVecMax, start);

	const radius = 7;  // ui: radius
	var spike = new THREE.TetrahedronGeometry(radius);
	// splineCurveA.updateArcLengths();

	// const spikeGeo = new THREE.BoxGeometry( 1, 5, 1 );
	// const spikeMat = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
	// const spike = new THREE.Mesh( spikeGeo, spikeMat );
	// scene.add( spike );

	var splineCurveB = new THREE.CubicBezierCurve3(mid, midEndAnchor, endAnchor, end);
	// splineCurveB.updateArcLengths();

	//	how many vertices do we want on this guy? this is for *each* side
	var vertexCountDesired = Math.floor( /*splineCurveA.getLength()*/ distanceBetweenCountryCenter * 0.02 + 6) * 0;

	//	collect the vertices
	var points = splineCurveA.getPoints(vertexCountDesired);

	//	remove the very last point since it will be duplicated on the next half of the curve
	points = points.splice(0, points.length - 1);

	// points = points.concat( splineCurveB.getPoints( vertexCountDesired ) );

	//	add one final point to the center of the earth
	//	we need this for drawing multiple arcs, but piled into one geometry buffer
	points.push(vec3_origin);

	var val = value * 0.0000002;

	var size = (10 + Math.sqrt(val));
	size = constrain(size, 0.1, 60);

	var curveGeometry = THREE.Curve.Utils.createLineGeometry(points);

	curveGeometry.size = size;


	return curveGeometry;
}

function constrain(v, min, max) {
	if (v < min)
		v = min;
	else
		if (v > max)
			v = max;
	return v;
}