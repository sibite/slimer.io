getBezierCurvePoint = function(degree, time, ...points)  {
  if (points.length == degree + 1)  {
    if (points.every(point => typeof point[0] == "number" && typeof point[1] == "number"))  {

      let firstPoint, secondPoint;

      if (degree > 1)  {
        let pointsLeft = [...points];
        let pointsRight = [...points];
        pointsLeft.pop();
        pointsRight.shift();
        firstPoint = getBezierCurvePoint(degree - 1, time, ...pointsLeft);
        secondPoint = getBezierCurvePoint(degree - 1, time, ...pointsRight);
      }
      else {
        firstPoint = points[0];
        secondPoint = points[1];
      }

      let x = (secondPoint[0] - firstPoint[0]) * time + firstPoint[0];
      let y = (secondPoint[1] - firstPoint[1]) * time + firstPoint[1];
      return [x, y];
    }
  }
}

BezierCurve = function(pointsQuantity, degree, ...points) {
  this.pointList = [];
  for (let i = 0; i < pointsQuantity; i++)  {
    this.pointList.push(getBezierCurvePoint(degree, i / (pointsQuantity - 1), ...points));
  }
  this.getYofX = function(x)  {
    let leftIndex = this.pointList.findIndex(
      (point, index) => point[0] == x    ||    point[0] < x  &&  this.pointList[index+1][0] > x
    );
    if (leftIndex == -1) {
      return null;
    }
    else if (this.pointList[leftIndex][0] == x)  {
      return this.pointList[leftIndex][1];
    }
    else {
      let barier = [this.pointList[leftIndex], this.pointList[leftIndex+1]];
      let innerPart = (x - barier[0][0]) / (barier[1][0] - barier[0][0]);
      let estimatedY = barier[0][1] + (barier[1][1] - barier[0][1]) * innerPart;
      return estimatedY;
    }
  }
}


//Ease curve points [0, 0], [0.5, 0], [0.5, 1], [1, 1]
