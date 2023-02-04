let Animated = function(value)  {
  this.value = value;
  this.realValue = value;
  this.animCount = 0;
}

let linear = new BezierCurve(2, 1, [0, 0], [1, 1]);
let ease = new BezierCurve(30, 3, [0, 0], [0.5, 0], [0.5, 1], [1, 1]);
let easeIn = new BezierCurve(30, 3, [0, 0], [0.5, 0], [1, 1], [1, 1]);
let easeOut = new BezierCurve(30, 3, [0, 0], [0, 0], [0.5, 1], [1, 1]);

Animated.prototype.animate = function(newValue, time, timingFunction = ease, delay = 0)  {
	let frameRate = gameObjInitialized ? game.frameRate : 60,
		i = 1,
		maxI = Math.max(Math.round(time / (1000 / frameRate)), 2),
		valueChange = newValue - this.realValue,
		startTimee = Date.now();
	this.realValue = newValue;
	this.animCount += 1;
	let frame = function()  {
		this.value += valueChange * (timingFunction.getYofX(i / (maxI-1)) - timingFunction.getYofX((i-1) / (maxI-1)) );
		i++
		if (i < maxI)  {
			let doTime = Date.now() - startTime;
			var startTime = Date.now();
			setTimeout(frame, 1000 / frameRate - doTime);
		}
		else  {
			this.animCount -= 1;
			if (this.animCount == 0)  {
				this.value = this.realValue
			}
		}
	}.bind(this);
	if (delay <= 0)
		frame();
	else
		setTimeout(frame, delay);
}