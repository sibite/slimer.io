let randNum = function(min, max)  {
  return min + Math.floor(Math.random() * (max - min + 1));
}

let bonePath = `M0.298,0.612c0,0.056 0.123,0.063 0.123,0.225c0,0.162
-0.21,0.161 -0.21,-0.011c0,0.172 -0.211,0.173 -0.211,0.011c0,-0.162
0.123,-0.169 0.123,-0.225l0,-0.103l0,-0.165c0,-0.055 -0.123,-0.062
-0.123,-0.224c0,-0.162 0.211,-0.161 0.211,0.011c0,-0.172 0.21,-0.173
0.21,-0.011c0,0.162 -0.123,0.169 -0.123,0.224l0,0.268Z`;

Array.prototype.contains = function(element)  {
  return this.indexOf(element) != -1;
}


//ANIMATIONS

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

//VECTORS

let Vector = function(x, y)	{
	Object.defineProperties(this, {
		x:	{
			get: function()	{
				return this._x;
			},
			set: function(value) {
				this._x = value;
				this.calc();
			}
		},
		y:	{
			get: function()	{
				return this._y;
			},
			set: function(value) {
				this._y = value;
				this.calc();
			}
		},
		length:	{
			get: function()	{
				return this._length;
			},
			set: function(value)	{
				if (this._length != 0)	{
					this._x *= value/this._length;
					this._y *= value/this._length;
				} else {
					this._x = this._y = value;
				}
				this._length = Math.abs(value);
			}
		},
		angle: {
			get: function() {
				return this._angle;
			},
			set: function(value)	{
				this._x = Math.cos(value) * this._length;
				this._y = -Math.sin(value) * this._length;
				this.calc();
			}
		}
	});
	this.x = x;
	this.y = y;
}

Vector.fromAngle = function(angle, length = 1)	{
	let vector = new Vector(length, 0);
	vector.angle = angle;
	return vector;
}
Vector.prototype.calc = function() {
	this._length = Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2));
	let angle = Math.atan2(-this.y, this.x);
	this._angle = angle >= 0 ? angle : 2*Math.PI + angle;
}
Vector.prototype.add = function() {
	if (arguments.length == 1)	{
		var vector = arguments[0];
		this._x += vector.x;
		this._y += vector.y;
		this.calc();
	}	else {
		this._x += arguments[0];
		this._y += arguments[1];
		this.calc();
	}
	return this;
}
Vector.prototype.subtract = function() {
	if (arguments.length == 1)	{
		var vector = arguments[0];
		this._x -= vector.x;
		this._y -= vector.y;
		this.calc();
	}	else {
		this._x -= arguments[0];
		this._y -= arguments[1];
		this.calc();
	}
	return this;
}
Vector.prototype.toLength = function(length) {
	let vector = this.copy();
	vector.length = length;
	return vector;
}
Vector.prototype.setLength = function(length) {
	this.length = length;
	return this;
}
Vector.prototype.toFactor = function() {
	this.length = 1;
	return this;
}
Vector.prototype.copy = function() {
	return new Vector(this.x, this.y);
}


//GAME ELEMENTS

let GameObject = function(game, mass, x, y, move = {}) {
	this.game = game;
	this.diameter = new Animated(game.getDiameter(mass));
	this.x = new Animated(x);
	this.y = new Animated(y);
	this.move = move;
	this.mass = mass;
	this.speed = 0;
}

GameObject.prototype.addMass = function(mass)  {
  this.setMass(this.mass + mass);
}

GameObject.prototype.setMass = function(mass)  {
  mass = Math.max(mass, 0.00001);
  let newDiameter = this.game.getDiameter(mass);
  this.diameter.animate(newDiameter, 700, easeOut);
  this.mass = mass;
  this.speed = 28 / Math.pow(newDiameter, 10/25);
}

GameObject.prototype.getPositionVector = function(animated = false) {
	if (animated) {
		return new Vector(this.x.value, this.y.value);
	}	else {
		return new Vector(this.x.realValue, this.y.realValue);
	}
}

GameObject.prototype.slowDownMove = function(name, slowness)	{
	let move = this.move[name];
	if (!move) {
		return new Vector(0, 0);
	}
	if (move.length > 0)	{
		var nextMove = move.toLength(Math.max(move.length - this.game.lastRenderTicks * slowness, 0)),
			middleRealMove = move.copy().add(nextMove).toLength((move.length + nextMove.length) / 2 * this.game.lastRenderTicks);
		this.move[name] = nextMove;
	}	else {
		var middleRealMove = move;
	}
	return middleRealMove;
}

let SlimePart = function(game, parent, mass, x, y, move = {splitting: new Vector(0, 0)}, lastMove = new Vector(0, 0))  {
	GameObject.call(this, game, mass, x, y, move);
	this.type = "SlimePart";
	this.parent = parent;
	this.color = parent.color;
	this.borderColor = parent.borderColor;
	this.move.repulsing = new Vector(0, 0);
	this.lastMove = lastMove;
	this.mouseFactor = lastMove.copy().toFactor();
	this.initialized = true;
	this.setMass(mass);
}

//SLIME PART

SlimePart.prototype = Object.create(GameObject.prototype);
Object.defineProperty(SlimePart.prototype, "constructor", {
	value: SlimePart, enumerable: false, writable: true});

SlimePart.prototype.explode = function(mass)  {
	if (this.initialized == true)  {
		if (this.parent.parts.length >= game.maxParts)  {
			this.addMass(mass);
		}
		else  {
			let massLeftToUse = this.game.explodeTotalMassFactor * this.mass,
				minMass = this.game.explodeMassMin,
				maxFactor = this.game.explodeMassMaxFactor,
				freeSlots;
			while ((freeSlots = this.game.maxParts - this.parent.parts.length) > 0 & massLeftToUse >= minMass)  {
				let nextMass = randNum(minMass, Math.max((massLeftToUse - freeSlots * minMass) * maxFactor, minMass)),
					angle = Math.random()*Math.PI*2,
					move = Vector.fromAngle(angle),
					startDistance = (this.diameter.realValue - this.game.getDiameter(nextMass)) / 2;
				massLeftToUse -= nextMass;
				move.length = this.game.explodeSpeed;
				this.parent.mergeTimeLeft = game.mergeTime;
				this.addMass(-nextMass);
				this.parent.parts.push(new SlimePart(
					this.game,
					this.parent,
					nextMass,
					this.x.realValue + Math.cos(angle) * startDistance,
					this.y.realValue + Math.sin(angle) * startDistance,
					{splitting: move}
				));
			}
		}
	}
}

//SLIME

let Slime = function(game, mass, color, borderColor, x, y)  {
	this.game = game;
	this.mass = mass;
	this.nickname = "";
	this.diameterSum = this.game.getDiameter(mass);
	this.color = color;
	this.borderColor = borderColor;
	this.img = null;
	this.mergeTimeLeft = 0;
	this.parts = [new SlimePart(game, this, mass, x, y)];
}

Slime.prototype.updateMass = function()  {
  let totalMass = this.parts.reduce((total, next) => total + next.mass, 0);
  this.mass = totalMass;
  this.diameterSum = game.getDiameter(totalMass);
};

Slime.prototype.split = function()  {
  if (this.parts.length < game.maxParts && !this.isSplitting)  {
    this.isSplitting = true;
    this.mergeTimeLeft = this.game.mergeTime;
    this.parts.sort((a, b) => b.mass - a.mass).filter(part => part.mass >= this.game.splitMinMass).forEach(function(part)  {
      if (this.parts.length < this.game.maxParts)  {
        if (!part.mouseFactor.length)  {
          let angle = Math.random() * Math.PI*2;
		  var launch = Vector.fromAngle(angle);
        } else  {
          var launch = part.mouseFactor;
        }
		launch.length = this.game.splitSpeed;
        part.setMass(part.mass / 2);
        this.parts.push(new SlimePart(
			this.game,
			this,
			part.mass, part.x.realValue, part.y.realValue,
			{splitting: launch},
			part.lastMove)
		);
      }
    }.bind(this));
    this.isSplitting = false;
  }
};

Slime.prototype.ejectMass = function()  {
	this.parts.filter(part => part.mass >= game.minEjectMass).forEach(function(part) {
		let x = part.x.realValue + ((part.diameter.realValue + this.game.ejectMass) / 2) * part.mouseFactor.x;
		let y = part.y.realValue + ((part.diameter.realValue + this.game.ejectMass) / 2) * part.mouseFactor.y;
		let position = part.mouseFactor.toLength(part.diameter.realValue/2+this.game.borderWidth).add(part.getPositionVector());
		game.ejectedMovingFoods.push(new Food(this.game, "Ejected food",
			this.game.ejectMass,
			this.color, this.borderColor,
			position.x, position.y, "auto",
			{ejecting: part.mouseFactor.toLength(this.game.ejectSpeed),
			 repulsing: new Vector(0, 0)}
		));
		part.addMass(-game.ejectMassLoss);
		game.repulsingFoodsCount += 1;
	}.bind(this));
}

//CACTUS

let Cactus = function(game, mass, color, borderColor, x, y, move)  {
	GameObject.call(this, game, mass, x, y, move);
	this.diameter.animate(0, 0);
	this.diameter.animate(game.getDiameter(mass), 250, easeOut);
	this.type = "Cactus";
	this.color = color;
	this.borderColor = borderColor;
}

Cactus.prototype = Object.create(GameObject.prototype);
Object.defineProperty(Cactus.prototype, "constructor", {
	value: Cactus, enumerable: false, writable: true});

Cactus.prototype.eat = function(food) {
	this.addMass(food.kcal);
	this.game.removeSlime(food, this.game.ejectedMovingFoods, this)
	if (this.mass > this.game.cactusMaxMass)  {
		this.setMass(this.mass / 2);
		this.game.cactuses.push(new Cactus(
			this.game,
			this.mass,
			this.color,
			this.borderColor,
			this.x.realValue, this.y.realValue,
			{splitting: food.move.ejecting.toLength(this.game.cactusSplitSpeed)}
		));
	}
}

//FOOD

let Food = function(game, type, mass, color, borderColor, x, y, kcal = "auto", move = {})		{
	GameObject.call(this, game, mass, x, y, move);
	this.type = type;
	if (animal) this.rotation = Math.random() * 2*Math.PI;
	if (kcal == "auto")
		this.kcal = mass;
	else
		this.kcal = kcal;
	this.color = color;
	this.borderColor = borderColor;
}

Food.prototype = Object.create(GameObject.prototype);
Object.defineProperty(Cactus.prototype, "constructor", {
	value: Food, enumerable: false, writable: true});


let Canvas = function() {
  this.resolutionReverse = 1;
  this.el = document.getElementById("game");
  this.el.style.display = "block";
  this.ctx = this.el.getContext("2d");
  this.scoreFontSize = 0;

  this.resize();
}

Canvas.prototype.resize = function(width = window.innerWidth, height = window.innerHeight)  {
	this.ratio = window.devicePixelRatio / this.resolutionReverse;
	this.el.width = this.width = width * this.ratio;
	this.el.height = this.height = height * this.ratio;
	this.el.style.width = (this.styleWidth = width) + "px";
	this.el.style.height = (this.styleHeight = height) + "px";
};

Canvas.prototype.clear = function()  {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

Canvas.prototype.renderGrid = function()  {
	let gridSpace = 50;
	let realLT = this.game.convertCoords(0, 0);
	let realRB = this.game.convertCoords(this.game.mapWidth, this.game.mapHeight);
	this.ctx.beginPath();
	for(x = gridSpace / 2; x < this.game.mapWidth; x += gridSpace)  {
		let realX = this.game.convertCoords(x).x;
		this.ctx.moveTo(realX, realLT.y);
		this.ctx.lineTo(realX, realRB.y);
	}
	for(y = gridSpace / 2; y < this.game.mapHeight; y += gridSpace)  {
		let realY = this.game.convertCoords(0, y).y;
		this.ctx.moveTo(realLT.x, realY);
		this.ctx.lineTo(realRB.x, realY);
	}
	this.ctx.lineWidth = this.game.viewScaleAnimated.value;
	this.ctx.strokeStyle = "rgba(127, 127, 127, 0.25)";
	this.ctx.stroke();
}

Canvas.prototype.drawSlime = function(slime)  {
  let scrCoords = this.game.convertCoords(slime.x.value, slime.y.value),
	  x = scrCoords.x, y = scrCoords.y, img = slime.parent.img,
	  diameter = slime.diameter.value,
	  fullDiameter = diameter + this.game.borderWidth*2;

  if (diameter > 0)  {

    //DEFAULT SLIME
    if (img === null)  {
      let fill = new Path2D();
      let border = new Path2D();
      this.ctx.lineWidth = this.game.borderWidth * this.game.viewScaleAnimated.value;
      this.ctx.strokeStyle = slime.borderColor;
      this.ctx.fillStyle = slime.color;
      fill.arc(x, y, fullDiameter/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
      this.ctx.fill(fill);
      border.arc(x, y, (diameter + this.game.borderWidth)/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
      this.ctx.stroke(border);

      //NICKNAME

      if (slime.parent.nickname != null)  {
        let nickname = slime.parent.nickname.slice(0, 32),
			customDiameter = fullDiameter - 10;
        this.ctx.font = "bold "+1+"px Ubuntu, sans-serif";
		let fontSize = Math.max(
			Math.min(customDiameter / this.ctx.measureText(nickname).width, 0.16 * customDiameter), 15
			) * this.game.viewScaleAnimated.value;
		this.ctx.font = "bold "+fontSize+"px Ubuntu, sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.strokeStyle = "rgba(0, 0, 0, 1)";
        this.ctx.lineWidth = fontSize / 10;
        this.ctx.lineJoin = "round";
        this.ctx.fillStyle = "rgb(255, 255, 255)";
        this.ctx.strokeText(nickname, x, y);
        this.ctx.fillText(nickname, x, y);
      }
    }
    //CUSTOM IMAGES
    if (img != null)  {
      diameter = (diameter + this.game.borderWidth * 2) * this.game.viewScaleAnimated.value;
      let maxSize = Math.max(img.width, img.height);

      this.ctx.drawImage(img,
        x - diameter/2 + diameter * (1 - img.width / maxSize) / 2,
        y - diameter/2 + diameter * (1 - img.height / maxSize) / 2,
        diameter * img.width / maxSize,
        diameter * img.height / maxSize);
    }
  }
}

Canvas.prototype.drawFood = function(food, withBorder = true)  {
  let scrCoords = this.game.convertCoords(food.x.value, food.y.value),
	  x = scrCoords.x, y = scrCoords.y,
	  diameter = food.diameter.value;

  if (diameter >= 0)	{

	  //DEFAULT FOOD
	  if (animal == undefined)  {
	    let fill = new Path2D();
	    let border = new Path2D();
	    this.ctx.lineWidth = this.game.borderWidth * this.game.viewScaleAnimated.value;
	    this.ctx.strokeStyle = food.borderColor;
	    this.ctx.fillStyle = food.color;
		if (withBorder)	{
		    fill.arc(x, y, (diameter/2 + this.game.borderWidth) * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
		    this.ctx.fill(fill);
		    border.arc(x, y, (diameter + this.game.borderWidth)/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
		    this.ctx.stroke(border);
		    this.ctx.globalAlpha = 1;
		}	else {
			fill.arc(x, y, diameter/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
		    this.ctx.fill(fill);
		}
	  }
	  //CUSTOM FOOD
	  else if (animal == "dog")  {
	    let scrDiameter = (diameter + this.game.borderWidth * 2) * this.game.viewScaleAnimated.value;
	    this.ctx.save();
	    this.ctx.translate(x, y);
	    this.ctx.rotate(food.rotation);
	    this.ctx.scale(scrDiameter * 1.3, scrDiameter * 1.3);
	    this.ctx.translate(-0.21, -0.5);

	    this.ctx.globalAlpha = food.opacity.realValue;
	    this.ctx.fillStyle = food.color;
	    let fill = new Path2D(bonePath);
	    this.ctx.fill(fill);
	    this.ctx.globalAlpha = 1;
	    this.ctx.restore();
	  }
  }
}

Canvas.prototype.drawCactus = function(cactus)  {
  let scrCoords = this.game.convertCoords(cactus.x.value, cactus.y.value);
  let x = scrCoords.x, y = scrCoords.y;
  let diameter = cactus.diameter.value;

  if (diameter >= 0)	{
	  let fill = new Path2D();
	  let border = new Path2D();
	  this.ctx.globalAlpha = cactus.opacity;
	  this.ctx.lineWidth = this.game.borderWidth * this.game.viewScaleAnimated.value;
	  this.ctx.strokeStyle = cactus.borderColor;
	  this.ctx.fillStyle = cactus.color;
	  let fullRadius = (diameter / 2 + this.game.borderWidth);
	  let spikes = diameter * 0.17;
	  let spikesLength = 10;
	  for (i = 0; i < spikes*2; i++)  {
	    let radian = Math.PI * i / spikes;
	    let radius = (fullRadius + i % 2 * spikesLength) * this.game.viewScaleAnimated.value;
	    let borderRadius = (fullRadius + i % 2 * spikesLength - this.game.borderWidth / 2) * this.game.viewScaleAnimated.value;
	    fill.lineTo(x + Math.cos(radian) * radius, y + Math.sin(radian) * radius);
	    border.lineTo(x + Math.cos(radian) * radius, y + Math.sin(radian) * radius);
	  }
	  fill.closePath();
	  border.closePath();
	  this.ctx.fill(fill);
	  this.ctx.stroke(border);
	}
}


let Game = function()  {
	gameObjInitialized = false;

	//DEFAULT SETTINGS

	//GENERAL
	this.canvas = canvas;
	this.frameRate = 80;
	this.borderWidth = 7;
	this.minPartToEat = 3/5;
	this.minMassToEatFactor = 0.75;
	this.eatAnimationLength = 200;
	this.mapWidth = 10000;
	this.mapHeight = 10000;
	this.lightBackgroundColor = "hsl(180, 100%, 96%)";
	this.darkBackgroundColor = "hsl(300, 100%, 4%)";
	this.letCustomImages = false;
	//PLAYER
	this.startMass = 12;
	this.maxParts = 16;
	//SPLITTING AND MERGING
	this.splitMinMass = 60;
	this.splitSpeed = 15;
	this.splitSpeedSlowness = 0.14;
	this.repulsingSpeed = 10;
	this.mergeTime = 30;
	this.mergeTimeGrow = 0.08;
	//EJECTING MASS
	this.minEjectMass = 120;
	this.ejectSpeed = 17;
	this.ejectedSlowness = 0.2;
	this.ejectMassLoss = 44;
	this.ejectMass = 39;
	//FOOD
	this.foodMass = 3.8;
	this.foodKcal = 2;
	this.foodPer100sqpx = 0.3;
	this.foodSpawnPerSecond = 3;
	this.foodPreSpawn = true;
	this.foodPreSpawnPart = 0.6;
	//CACTUSES
	this.cactusMass = 280;
	this.cactusMaxMass = 560;
	this.cactusSplitSpeed = 32;
	this.cactusSplitSpeedSlowness = 0.5;
	this.cactusesPer100sqpx = 0.0015;
	this.cactusesSpawnPerSec = 0.2;
	this.cactusesPreSpawn = true;
	this.cactusesPreSpawnPart = 1;
	//EXPLODING
	this.explodeSpeed = 15;
	this.explodeTotalMassFactor = 0.65;
	this.explodeMassMin = 40;
	this.explodeMassMaxFactor = 0.6

	//INNER PROPERTIES
	this.noFoodSpawningTime = 0;
	this.noCactusSpawningTime = 0;
	this.repulsingFoodsCount;
	this.viewScale = 1 * this.canvas.ratio;
	this.viewScaleAnimated = new Animated(this.viewScale);
	this.camX = this.mapWidth / 2;
	this.camY = this.mapHeight / 2;
	this.camXanimated = new Animated(this.camX);
	this.camYanimated = new Animated(this.camY);
	this.foods = [];
	this.ejectedFoods = [];
	this.ejectedMovingFoods = [];
	this.cactuses = [];
	this.removedSlimes = [];
	let playerColor = randNum(0, 360);
	this.player = new Slime(
		this,
        this.startMass,
        "hsl("+playerColor+", 100%, 50%)",
        "hsl("+playerColor+", 100%, 40%)",
        this.mapWidth / 2,
        this.mapHeight / 2
	);

	let mouseC = this.convertCoords(this.mapWidth / 2, this.mapHeight / 2);
	this.mouse = new Vector(mouseC.x, mouseC.y);

	gameObjInitialized = true;
}

//GAME ALL-PURPOSE FUNCTIONS

Game.prototype.setMousePosition = function(x, y)	{
	this.mouse = new Vector(x, y);
}

Game.prototype.convertCoords = function(x, y)  {
  let camLeft = this.camXanimated.value - this.canvas.width / 2 / this.viewScaleAnimated.value;
  let camTop = this.camYanimated.value - this.canvas.height / 2 / this.viewScaleAnimated.value;
  let canvasX = (x - camLeft) * this.viewScaleAnimated.value;
  let canvasY = (y - camTop) * this.viewScaleAnimated.value;
  return {x: canvasX, y: canvasY};
};

Game.prototype.isOnScreen = function(object)  {
	let canvasCoords = this.convertCoords(object.x.value, object.y.value);
	if (object.type == "Food")	{
		var radius = object.diameter.value / 2 * this.viewScaleAnimated.value;
	}	else if (object.type == "Ejected food") {
		var radius = (object.diameter.value / 2 + this.borderWidth) * this.viewScaleAnimated.value;
	}	else if (object.type == "Cactus") {
		var radius = (object.diameter.value / 2 + this.borderWidth + 10) * this.viewScaleAnimated.value;
	}

	return canvasCoords.x > 0 - radius && canvasCoords.x < this.canvas.width + radius
		&& canvasCoords.y > 0 - radius && canvasCoords.y < this.canvas.height + radius;
}

Game.prototype.getMass = function(diameter)  {
  return Math.pow(diameter / 2, 2) * Math.PI / 100;
}

Game.prototype.getDiameter = function(mass)  {
  return Math.sqrt(mass * 100 / Math.PI) * 2;
}

Game.prototype.getDistance = function(x1, y1, x2, y2)  {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

Game.prototype.getDistanceObj = function(obj1, obj2, animated = false) {
	if (animated)	{
		return Math.sqrt(Math.pow(obj2.x.value - obj1.x.value, 2) + Math.pow(obj2.y.value - obj1.y.value, 2));
	}	else {
		return Math.sqrt(Math.pow(obj2.x.realValue - obj1.x.realValue, 2) + Math.pow(obj2.y.realValue - obj1.y.realValue, 2));
	}
}

Game.prototype.getDistanceBetween = function(distance, diameter1, diameter2)  {
  return distance - (diameter1 + diameter2 + this.borderWidth*4) / 2;
}

Game.prototype.getDistanceBetweenObj = function(object1, object2, animated = false) {
	let distance = this.getDistanceObj(object1, object2, animated),
		diameters,
		borders = this.borderWidth * [object1, object2].filter(object => object.type != "Food").length;
	if (animated)	{
		diameters = object1.diameter.value + object2.diameter.value;
	} else {
		diameters = object1.diameter.realValue + object2.diameter.realValue;
	}
	return distance - (diameters / 2 + borders);
}

Game.prototype.moveObject = function(object, diffX, diffY, animationTime = 0)  {
  object.x.animate(object.x.realValue + diffX, animationTime);
  object.y.animate(object.y.realValue + diffY, animationTime);
}

Game.prototype.moveObjectTo = function(object, x, y, animationTime = 0)  {
  object.x.animate(x, animationTime);
  object.y.animate(y, animationTime);
}

Game.prototype.moveInsideBorder = function(object)  {
	let position = object.getPositionVector();
	let newX = position.x < 0 ? 0 : position.x > this.mapWidth ? this.mapWidth : position.x;
	let newY = position.y < 0 ? 0 : position.y > this.mapHeight ? this.mapHeight : position.y;
	this.moveObjectTo(object, newX, newY);
	//BOUNCING OF THE EDGES OR STOPPING
	if (newX == 0 || newX == this.mapWidth)  {
		if (object.move.ejecting) {
			object.move.ejecting.angle = Math.PI - object.move.ejecting.angle;
			object.move.ejecting.length *= 0.6;
		}
		if (object.type == "Cactus") {
			object.move.splitting.angle = Math.PI - object.move.splitting.angle;
			object.move.splitting.length *= 0.6;
		} else if (object.move.splitting) {
			object.move.splitting.length = 0;
		}
	}
	if (newY == 0 || newY == this.mapHeight) {
		if (object.move.ejecting) {
			object.move.ejecting.angle = Math.PI*2 - object.move.ejecting.angle;
			object.move.ejecting.length *= 0.6;
		}
		if (object.type == "Cactus") {
			object.move.splitting.angle = Math.PI*2 - object.move.splitting.angle;
			object.move.splitting.length *= 0.6;
		} else if (object.move.splitting) {
			object.move.splitting.length = 0;
		}
	}
};

Game.prototype.spawnFood = function()  {
  let x = randNum(0, this.mapWidth);
  let y = randNum(0, this.mapHeight);
  let hue = randNum(0, 360);
  let color = "hsl("+hue+", 100%, 50%)";
  this.foods.push(new Food(this, "Food", this.foodMass, color, color, x, y, this.foodKcal));
};

Game.prototype.spawnCactus = function()  {
	//TO DO
  let x, y, valid, diameter = this.getDiameter(this.cactusMass), i = 0;
  do {
    x = randNum(0, this.mapWidth);
    y = randNum(0, this.mapHeight);
    valid = this.player.parts.every(function(part) {
      return this.getDistanceBetween(
        this.getDistance(part.x.realValue, part.y.realValue, x, y),
        part.diameter, diameter) > 200;
    }.bind(this));
    i++;
  }  while (!valid && i < 100)
  let color = "hsl(108, 100%, 50%)";
  let borderColor = "hsl(108, 100%, 40%)";
  this.cactuses.push(new Cactus(this, this.getMass(diameter), color, borderColor, x, y));
};

Game.prototype.clearOutsideElements = function()  {
  [this.foods, this.ejectedFoods, this.ejectedMovingFoods, this.cactuses].forEach(function(elements)  {
    elements = elements.filter(element =>
      (element.x.realValue <= this.mapWidth && element.x.realValue >= 0) && (element.y.realValue <= this.mapHeight && element.y.realValue >= 0)
    );
  });
};

Game.prototype.setRepulsingMoves = function(object1, object2)  {
	object1X = object1.x.realValue + object1.move.repulsing.x;
	object1Y = object1.y.realValue + object1.move.repulsing.y;
	object2X = object2.x.realValue + object2.move.repulsing.x;
	object2Y = object2.y.realValue + object2.move.repulsing.y;
	let distance = this.getDistance(object1X, object1Y, object2X, object2Y),
		distanceBetween = this.getDistanceBetween(distance, object1.diameter.value, object2.diameter.value);
	var splitting = false;
	if (object1.move && object1.move.splitting)	{
		var splitting = object1.move.splitting.length > 1;
	}
	if (object2.move && object2.move.splitting) {
		var splitting = splitting || object2.move.splitting.length > 1;
	}

	if (distanceBetween < 0 && distance != 0
		&& !splitting)  {
		let factor = object1.getPositionVector().subtract(object2.getPositionVector()).toFactor(),
			change = factor.toLength(this.lastRenderTicks * this.repulsingSpeed),
			object1Speed = object1.speed || 1,
			object2Speed = object2.speed || 1,
			totalSpeed = object1Speed + object2Speed;
		if (change.length > -distanceBetween) {
			change.length = -distanceBetween;
		}
		let object1Change = factor.toLength(change.length * object1Speed / totalSpeed);
			object2Change = factor.toLength(-change.length * object2Speed / totalSpeed);
		object1.move.repulsing.add(object1Change);
		object2.move.repulsing.add(object2Change);
		}
	this.moveInsideBorder(object1);
	this.moveInsideBorder(object2);
};

Game.prototype.getHiddenChildParentRadius = function(child, parent) {
	return Math.max(
		(parent.diameter.value / 2 + this.borderWidth)
		- (child.diameter.value / 2 + this.borderWidth + 2), 0);
}

Game.prototype.getToBorderVector = function(child, parent)	{
	let targetRadius = this.getHiddenChildParentRadius(child, parent),
		diffTargetVector =
		new Vector(parent.x.value, parent.y.value)
		.subtract(child.x.value, child.y.value);
	diffTargetVector.length -= targetRadius;
	return diffTargetVector;
}

Game.prototype.removeSlime = function(slime, parentArray, eatenBy = undefined)  {
  if (eatenBy != undefined)  {
    this.removedSlimes.push(slime);
	slime.eatenBy = eatenBy;
	slime.eatenByDistance = this.getToBorderVector(slime, eatenBy).length;
	slime.diameterOriginal = slime.diameter.realValue;
  }
  let index = parentArray.indexOf(slime);
  parentArray.splice(index, 1);
};


var gameObjInitialized = false;
let game;
let canvas = new Canvas();
let animals = {dog: "images/Jack Russel Terrier.svg"};
let animal;


//INITIALIZE AND RENDER

Game.prototype.initialize = function()  {
  for(let i = 0; i < this.mapWidth*this.mapHeight/10000 * this.foodPer100sqpx * this.foodPreSpawnPart; i++)  {
    this.spawnFood();
  }
  for(let i = 0; i < this.mapWidth*this.mapHeight/10000 * this.cactusesPer100sqpx * this.cactusesPreSpawnPart; i++)  {
    this.spawnCactus();
  }
  canvas.game = this;

  //LOAD CUSTOM IMAGES
  if (this.letCustomImages)  {
    let tempAnimal = this.player.nickname.toLowerCase();
    if (Object.keys(animals).contains(tempAnimal))  {
      animal = tempAnimal;
      let img = new Image();
      img.src = animals[animal];
      this.player.img = img;
    }
  }

  this.lastRenderTime = Date.now();
  this.lastRenderTicks = 0;
  this.render();
}

Game.prototype.pause = function()  {
	this.paused = true;
}

Game.prototype.resume = function()  {
	this.paused = false;
	this.lastRenderTime = Date.now();
	this.render();
}


Game.prototype.render = function()	{
	if (this.paused)  {
		return 0;
	}
	let startTime = Date.now();
	this.lastRenderTimespan = startTime - this.lastRenderTime;
	this.lastRenderTimespan = this.lastRenderTimespan != 0 ? this.lastRenderTimespan : 1;
	this.lastRenderTicks = this.lastRenderTimespan / 16.66666666666;
	this.lastRenderTime = startTime;


	//SPAWN FOODS
	{
	this.noFoodSpawningTime += this.lastRenderTimespan;
	let nfst = this.noFoodSpawningTime / 1000;
	let interval = 1 / this.foodSpawnPerSecond;
	while(nfst > interval)  {
		if (this.foods.length < this.mapWidth*this.mapHeight / (100*100) * this.foodPer100sqpx)  {
		  this.spawnFood();
		}
	this.noFoodSpawningTime -= interval * 1000;
	nfst = this.noFoodSpawningTime / 1000;
	}
	}


	//SPAWN CACTUSES
	{
	this.noCactusSpawningTime += this.lastRenderTimespan;
	let ncst = this.noCactusSpawningTime / 1000;
	let interval = 1 / this.cactusesSpawnPerSec;
	while(ncst > interval)  {
		if (this.cactuses.length < this.mapWidth*this.mapHeight / (100*100) * this.cactusesPer100sqpx)  {
		  this.spawnCactus();
		}
	this.noCactusSpawningTime -= interval * 1000;
	ncst = this.noCactusSpawningTime / 1000;
	}
	}

	//UPDATE PLAYER POSITIONS

	this.player.parts.forEach(function(part) {
		part.previousPosition = part.getPositionVector();

		//EXTRA SPEED SLOWNESS

		var move = part.slowDownMove("splitting", this.splitSpeedSlowness);
		this.moveObject(part, move.x, move.y);

		//MOVING PARTS BY MOUSE

		let canvasPosition = this.convertCoords(part.x.value, part.y.value),
			mouseFactor = this.mouse.copy().subtract(canvasPosition),
			minCanvasSize = Math.min(this.canvas.width, this.canvas.height),
			partMove = mouseFactor.copy();
		mouseFactor.length /= minCanvasSize;
		if (mouseFactor.length < 0.02) {
			partMove.length = 0;
		} else {
			partMove.length = Math.min((mouseFactor.length - 0.02) / 0.05, 1) * part.speed * this.lastRenderTicks;
		}
		part.mouseFactor = partMove.copy().toFactor();
		this.moveObject(part, partMove.x, partMove.y);
		this.moveInsideBorder(part);

	}.bind(this));

	//PARTS MERGING

	let mergeDone = false;
	this.player.mergeTimeLeft -= this.lastRenderTimespan / 1000;
	let mergingParts = this.player.parts.filter(part => this.player.mergeTimeLeft + part.diameter.realValue * this.mergeTimeGrow <= 0)
	                                    .sort((a, b) => b.diameter.realValue - a.diameter.realValue);
	let tempMergingParts = [...mergingParts];

	while  (tempMergingParts.length > 1)  {
	  part = tempMergingParts[0];
	  toMergeParts = tempMergingParts.filter(otherPart => part != otherPart && otherPart.diameter.realValue <= part.diameter.realValue)
	  .filter(function(otherPart)  {
	    let distanceBetween = this.getDistanceBetweenObj(part, otherPart);
	    return -distanceBetween > otherPart.diameter.realValue * this.minPartToEat;
	  }.bind(this)).forEach(function(otherPart)  {
	    part.addMass(otherPart.mass);
	    tempMergingParts.splice(tempMergingParts.indexOf(otherPart));
	    this.removeSlime(otherPart, this.player.parts, part);
	    mergeDone = true;
	  }.bind(this));
	  tempMergingParts.splice(tempMergingParts.indexOf(part), 1);
	}

	//PARTS AND FOOD REPULSING


	this.player.parts.filter(part => mergingParts.indexOf(part) == -1)
	.forEach(function(part)  {
	  this.player.parts.filter(otherPart => part != otherPart)
	  .forEach(function(otherPart)  {
	    this.setRepulsingMoves(part, otherPart);
	  }.bind(this));
	}.bind(this));

	this.player.parts.forEach(function(part) {
		if (part.move.repulsing && part.move.repulsing.length > 0) {
			this.moveObject(part, part.move.repulsing.x, part.move.repulsing.y)
			part.move.repulsing.length = 0;
		}
	}.bind(this));

	if (this.repulsingFoodsCount !== 0 || this.ejectedMovingFoods.length > 0)  {
	  let ejectedFoods = [...this.ejectedFoods, ...this.ejectedMovingFoods];
	  this.repulsingFoodsCount = 0;
	  ejectedFoods.forEach(function(ejectedFood)  {
	    ejectedFoods.forEach(function(otherEjectedFood)  {
	      if (otherEjectedFood != ejectedFood && this.getDistanceBetweenObj(ejectedFood, otherEjectedFood) < -1)  {
	        this.setRepulsingMoves(ejectedFood, otherEjectedFood);
			this.moveObject(ejectedFood, ejectedFood.move.repulsing.x, ejectedFood.move.repulsing.y);
			ejectedFood.move.repulsing.length = 0;
	        this.repulsingFoodsCount += 1;
	      }
	    }.bind(this));
	  }.bind(this));
	}

	//UPDATE MOVE INDICATORS

	this.player.parts.forEach(function(part) {
		part.lastMove = part.getPositionVector().subtract(part.previousPosition);
	});

	//CAMERA MOVE

	let newCamX = this.player.parts.reduce((total, next) => total + next.x.realValue, 0) / this.player.parts.length,
		newCamY = this.player.parts.reduce((total, next) => total + next.y.realValue, 0) / this.player.parts.length;

	if (isNaN(newCamX) || isNaN(newCamY))	{
		newCamX = this.camXanimated.realValue;
		newCamY = this.camYanimated.realValue;
	}
	if (mergeDone)  {
		this.camXanimated.animate(newCamX, 500, easeOut);
		this.camYanimated.animate(newCamY, 500, easeOut);
	}
	else  {
		this.camXanimated.animate(newCamX, 0, linear);
		this.camYanimated.animate(newCamY, 0, linear);
	}

	//UPDATE VIEW SCALE
	{
	let minSize = Math.min(this.canvas.styleWidth, this.canvas.styleHeight),
		size = minSize,
		diameter = this.player.diameterSum;
	/*MULTIPLAYER MODE: size = 1000;*/
	let newViewScale = minSize / (diameter + Math.pow(size/1000, 0.4) * 400) * 0.6 * this.canvas.ratio
	* Math.pow(0.93, Math.log(this.player.parts.length));
	newViewScale = isNaN(newViewScale) ? this.viewScaleAnimated.realValue : newViewScale;
	if (newViewScale != this.viewScale)  {
		this.viewScale = newViewScale;
		this.viewScaleAnimated.animate(this.viewScale, 700, easeOut);
	}
	}

	//MOVING FOODS AND CACTUSES

	this.ejectedMovingFoods.forEach(function(ejectedFood) {
		let move = ejectedFood.slowDownMove("ejecting", this.ejectedSlowness);
		this.moveObject(ejectedFood, move.x, move.y);
		this.moveInsideBorder(ejectedFood);
	}.bind(this));

	this.cactuses.forEach(function(cactus) {
		let move = cactus.slowDownMove("splitting", this.cactusSplitSpeedSlowness);
		this.moveObject(cactus, move.x, move.y);
		this.moveInsideBorder(cactus);
	}.bind(this));


	//EATING FOODS

	this.player.parts.forEach(function(part) {
		[this.foods, this.ejectedFoods, this.ejectedMovingFoods].forEach(function(foodArray) {
			foodArray.forEach(function(food) {
				let distanceBetween = this.getDistanceBetweenObj(part, food);
				if (-distanceBetween > food.diameter.realValue * this.minPartToEat) {
					part.addMass(food.kcal);
					this.removeSlime(food, foodArray, part);
				}
			}.bind(this));
		}.bind(this));
	}.bind(this));


	//EATING CACTUSES

	this.player.parts.forEach(function(part)  {
		this.cactuses.forEach(function(cactus)  {
		  let distanceBetween = this.getDistanceBetweenObj(part, cactus);
		  if (
		    -distanceBetween > cactus.diameter.realValue * this.minPartToEat
		    && cactus.mass < part.mass * this.minMassToEatFactor
		  )  {
		    part.explode(cactus.mass);
		    this.removeSlime(cactus, this.cactuses, part);
		  }
		}.bind(this));
	}.bind(this));

	this.player.updateMass();

	//CACTUSES EATING FOODS

	this.cactuses.forEach(function(cactus)  {
		this.ejectedMovingFoods.forEach(function(ejectedFood)  {
			let distanceBetween = this.getDistanceBetweenObj(cactus, ejectedFood);
			if (-distanceBetween > ejectedFood.diameter.realValue * this.minPartToEat)  {
				cactus.eat(ejectedFood);
			}
		}.bind(this));
	}.bind(this));


	//UPDATE REMOVED SLIME POSITIONS AND REMOVE NOT SEEN

	this.removedSlimes.forEach(function(rmSlime) {
		let eatenBy = rmSlime.eatenBy,
			diff = this.getToBorderVector(rmSlime, eatenBy),
			rmSlimeMove = eatenBy.lastMove ? new Vector(eatenBy.lastMove.x, eatenBy.lastMove.y) : new Vector(0, 0);
			lastDistance = diff.length,
			speedFactor = 0.03;
		diff.length = 2 * this.lastRenderTimespan / 60 + diff.length * speedFactor + rmSlimeMove.length;
		this.moveObject(rmSlime, diff.x, diff.y);
		if (this.getToBorderVector(rmSlime, eatenBy).length >= lastDistance)	{
			this.moveObject(rmSlime, -diff.x, -diff.y);
		}
		rmSlime.diameter.animate(Math.min(
			rmSlime.diameterOriginal/2 + rmSlime.diameterOriginal*1/2 * lastDistance / rmSlime.eatenByDistance,
			rmSlime.diameterOriginal
		), 0);
		//REMOVE NOT SEEN ANYMORE
		let distanceToCenter = this.getDistanceObj(rmSlime, eatenBy, true);
		if (distanceToCenter <= this.getHiddenChildParentRadius(rmSlime, eatenBy) || distanceToCenter < 5 || eatenBy.removed)	{
			rmSlime.removed = true;
			this.removedSlimes.splice(this.removedSlimes.indexOf(rmSlime), 1);
		}
	}.bind(this));


	//RENDER GRID

	this.canvas.clear();
	if (gui.darkMode)  {
	this.canvas.ctx.fillStyle = this.darkBackgroundColor;
	this.canvas.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	} else  {
	this.canvas.ctx.fillStyle = this.lightBackgroundColor;
	this.canvas.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}
	this.canvas.renderGrid();


	//RENDER REMOVED SLIMES

	this.removedSlimes.forEach(function(rmSlime)  {
		if (rmSlime.type == "Cactus")  {
			this.canvas.drawCactus(rmSlime);
		}
		else if (rmSlime.type == "SlimePart") {
			this.canvas.drawSlime(rmSlime);
		}
		else if (rmSlime.type == "Food"){
			this.canvas.drawFood(rmSlime, false);
		}
		else if (rmSlime.type == "Ejected food") {
			this.canvas.drawFood(rmSlime);
		}
	}.bind(this));


	//RENDER FOODS
	this.foods.filter(this.isOnScreen.bind(this)).forEach(function(food) {
		this.canvas.drawFood(food, false);
	}.bind(this));
	this.ejectedFoods.concat(this.ejectedMovingFoods).filter(this.isOnScreen.bind(this)).forEach(function(food) {
		this.canvas.drawFood(food);
	}.bind(this));


	//RENDER PLAYER, OTHER SLIMES AND CACTUSES
	{
	let slimes = this.player.parts.concat(this.cactuses.filter(this.isOnScreen.bind(this)));
	slimes.sort((a, b) => a.diameter.value - b.diameter.value);
	slimes.forEach(function(slime) {
	  if (slime.type == "SlimePart")  {
	    this.canvas.drawSlime(slime);
	  } else if (slime.type == "Cactus")  {
	    this.canvas.drawCactus(slime);
	  }
	}.bind(this));
	}

	//GUI INTERACT

	if (gui != undefined)  {
		let mass = String(Math.floor(this.player.mass)),
			thousands = [];
		for (let pos = 0; pos <= mass.length + 2; pos += 3) {
			thousands.unshift(mass.substr(-pos-3, Math.min(3, mass.length - pos)));
		}
		gui.massCounter.innerHTML = thousands.join(" ");
	}

	setTimeout(this.render.bind(this), 1000 / game.frameRate - (Date.now() - startTime));
}
