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
