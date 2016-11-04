function BodyGeometry(bodyHeight, bodyWidth){

  THREE.Geometry.call(this);

  var tubularSeg = 12;
  var radialSeg = 4;
  var bodyH = bodyHeight * 2 / 3;
  var radialAdd = bodyH / (radialSeg - 1);
  var tubularAdd = 2 * Math.PI / tubularSeg;
  var a = bodyWidth / 2.5;  //半實軸
  var b = bodyH / 2;  //半虛軸
  var center = new THREE.Vector3(0, b, 0);
  var geo = this;
  var positionObj = new THREE.Object3D();

  for (var h = 0; h <= bodyH; h += radialAdd) {
    var y = h;
    var x = Math.sqrt((((y - center.y) * (y - center.y) / (b * b) + 1) * a * a)) - center.x;

  	for (var i = 0; i < 2 * Math.PI; i += tubularAdd) {
      positionObj.rotation.y = i;
      positionObj.updateMatrixWorld();
      geo.vertices.push(positionObj.localToWorld(new THREE.Vector3(x, y, 0)));
    }
  }

  var len = Math.floor(geo.vertices.length - tubularSeg);
  var modMax = tubularSeg - 1;

  for(var index = 0; index < len; index++) {
    var face = (index % tubularSeg === modMax) ?
      new THREE.Face3(index, index + 1 - tubularSeg, index + tubularSeg) :
      new THREE.Face3(index, index + 1, index + tubularSeg);

    face.materialIndex = 0;
    geo.faces.push(face);
    var y = Math.floor(index / tubularSeg) / (radialSeg - 1);
    var x = index % tubularSeg / tubularSeg;
    var p1 = new THREE.Vector2(x + 1/tubularSeg, y);
    var p2 = new THREE.Vector2(x, y + 1 / (radialSeg - 1));
    var p3 = new THREE.Vector2(x + 1/tubularSeg, y + 1 / (radialSeg - 1));
    geo.faceVertexUvs[0].push([new THREE.Vector2(x, y), p1, p2]);

    var face2 = (index % tubularSeg === modMax) ?
      new THREE.Face3(index + tubularSeg, index - modMax, index + 1) :
      new THREE.Face3(index + tubularSeg, index + 1, index + tubularSeg + 1);
    face.materialIndex = 0;
    geo.faces.push(face2);
    geo.faceVertexUvs[0].push([p2, p1, p3]); 
  }

  geo.computeBoundingSphere();
  geo.computeFaceNormals();
  geo.computeVertexNormals();

}

BodyGeometry.prototype = Object.create(THREE.Geometry.prototype);
BodyGeometry.prototype.constructor = BodyGeometry;

export { BodyGeometry };
