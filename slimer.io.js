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
  let frameRate = gameObjInitialized ? game.frameRate : 60;
  let i = 1;
  let valueChange = newValue - this.realValue;
  let maxI = Math.round(time / (1000 / frameRate));
  this.realValue = newValue;
  this.animCount += 1;
  let frame = function()  {
    if (maxI > 1)  {
      this.value += valueChange * (    timingFunction.getYofX(i / (maxI-1)) - timingFunction.getYofX((i-1) / (maxI-1))   );
    }  else  {
      this.value += valueChange;
    }
    i++
    if (i < maxI)  {
      setTimeout(frame, 1000 / frameRate);
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


//GAME ELEMENTS

let SlimePart = function(parent, diameter, x, y, xExtraSpeed = 0, yExtraSpeed = 0, xMove = 0, yMove = 0)  {
  this.initialized = false;
  this.type = "SlimePart";
  this.parent = parent;
  this.diameter = diameter;
  this.diameterAnimated = new Animated(diameter);
  this.color = parent.color;
  this.borderColor = parent.borderColor;
  this.opacity = new Animated(1);
  this.score = 0;
  this.speed = 0;
  this.xExtraSpeed = xExtraSpeed;
  this.yExtraSpeed = yExtraSpeed;
	this.x = x;
	this.y = y;
  this.xAnimated = new Animated(x);
  this.yAnimated = new Animated(y);
  this.xMove = xMove;
  this.yMove = yMove;

  this.updateDiameter(diameter);
  this.initialized = true;
}

SlimePart.prototype.addMass = function(mass)  {
  let customBaseArea = Math.pow(this.diameter / 2, 2);
  let customAddArea = mass * 100 / Math.PI;
  let newDiameter = Math.sqrt(customBaseArea + customAddArea) * 2;
  this.updateDiameter(newDiameter);
}

SlimePart.prototype.setMass = function(mass)  {
  mass = Math.max(mass, 0.00001);
  let newDiameter = Math.sqrt(mass * 100 / Math.PI) * 2;
  this.updateDiameter(newDiameter);
}

SlimePart.prototype.updateDiameter = function(diameter)  {
  this.diameterAnimated.animate(diameter, 700, easeOut);
  this.diameter = diameter;
  this.score = Math.floor(Math.pow(diameter/2, 2) * Math.PI / 100);
  this.speed = 25 / Math.pow(this.diameter, 10/25);
};

SlimePart.prototype.explode = function(mass)  {
  if (this.initialized == true)  {
    if (this.parent.parts.length >= game.maxParts)  {
      this.addMass(mass);
    }
    else  {
      let explodeMass = Math.max(game.getMass(this.diameter) * game.explodeMassFactor, game.minSplitMass / 2);
      while (this.parent.parts.length < game.maxParts && explodeMass <= game.getMass(this.diameter) / 2)  {
        let radian = Math.random() * Math.PI * 2;
        this.parent.mergeTimeLeft = game.mergeTime;
        this.addMass(-explodeMass);
        this.parent.parts.push(new SlimePart(
          this.parent,
          game.getDiameter(explodeMass),
          this.x + Math.cos(radian) * this.diameter / 2,
          this.y + Math.sin(radian) * this.diameter / 2,
          Math.cos(radian) * game.splitSpeed * 1.5,
          Math.sin(radian) * game.splitSpeed * 1.5
        ));
      }
    }
  }
}


let Slime = function(diameter, color, borderColor, x, y)  {
  this.score = Math.floor(Math.pow(diameter/2, 2) * Math.PI / 100);
  this.nickname = "";
  this.diameterSum = diameter;
	this.color = color;
	this.borderColor = borderColor;
  this.img = null;
  this.mergeTimeLeft = 0;
  this.parts = [new SlimePart(this, diameter, x, y)];
  this.lastPosUpdate = Date.now();
}

Slime.prototype.updateScore = function()  {
  let totalMass = this.parts.reduce((total, next) => total + game.getMass(next.diameter), 0);
  this.score = Math.floor(totalMass);
  this.diameterSum = game.getDiameter(totalMass);
};

Slime.prototype.split = function()  {
  if (this.parts.length < game.maxParts && !this.isSplitting)  {
    this.isSplitting = true;
    this.mergeTimeLeft = game.mergeTime;
    this.parts.filter(part => part.score >= game.minSplitMass).forEach(function(part)  {
      if (this.parts.length < game.maxParts)  {
        let xLaunchSpeed, yLaunchSpeed;
        if (part.mouseXfactor == 0 && part.mouseYfactor == 0)  {
          let angle = Math.random() * Math.PI;
          xLaunchSpeed = Math.cos(angle) * game.splitSpeed;
          yLaunchSpeed = Math.sin(angle) * game.splitSpeed;
        } else  {
          xLaunchSpeed = part.mouseXfactor * game.splitSpeed;
          yLaunchSpeed = part.mouseYfactor * game.splitSpeed;
        }
        part.setMass(game.getMass(part.diameter) / 2);
        this.parts.push(new SlimePart(
          this,
          part.diameter, part.x, part.y,
          part.xMove + xLaunchSpeed, part.yMove + yLaunchSpeed,
          part.xMove, part.yMove));
      }
    }.bind(this));
    this.isSplitting = false;
  }
};

Slime.prototype.ejectMass = function()  {
  this.parts.filter(part => part.score >= game.minEjectMass).forEach(function(part) {
    let foodDiameter = Math.sqrt(game.ejectMass / Math.PI * 100) * 2;
    let x = part.x + ((part.diameter + foodDiameter) / 2) * part.mouseXfactor;
    let y = part.y + ((part.diameter + foodDiameter) / 2) * part.mouseYfactor;
    game.ejectedMovingFoods.push(new Food(foodDiameter,
      this.color, this.borderColor,
      game.borderWidth,
      x, y, "auto",
      part.mouseXfactor * game.ejectSpeed,
      part.mouseYfactor * game.ejectSpeed
    ));
    part.addMass(-game.ejectMassLoss);
    game.repulsingFoodsCount += 1;
  }.bind(this));
}


let Cactus = function(diameter, color, borderColor, x, y, xSpeed = null, ySpeed = null)  {
  this.type = "Cactus";
  this.diameter = diameter;
  this.diameterAnimated = new Animated(diameter);
  this.color = color;
  this.borderColor = borderColor;
  this.opacity = new Animated(1);
  this.x = x;
  this.y = y;
  this.xAnimated = new Animated(x);
  this.yAnimated = new Animated(y);
  this.xSpeed = 0;
  this.ySpeed = 0;
  if (xSpeed != null && ySpeed != null)  {
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
  }
}

Cactus.prototype.addMass = SlimePart.prototype.addMass;
Cactus.prototype.setMass = SlimePart.prototype.setMass;
Cactus.prototype.updateDiameter = SlimePart.prototype.updateDiameter;


let Food = function(diameter, color, borderColor, borderWidth, x, y, kcal = "auto", xSpeed = null, ySpeed = null)		{
  this.type = "Food";
  this.diameter = diameter;
  this.diameterAnimated = new Animated(diameter);
  this.rotation = Math.random() * 2*Math.PI;
  if (kcal == "auto")
    this.kcal = game.getMass(diameter);
  else if (kcal == "withBorder")
    this.kcal = game.getMass(diameter + borderWidth * 2);
  else
    this.kcal = kcal;
  this.color = color;
  this.borderColor = borderColor;
  this.opacity = new Animated(1);
  this.x = x;
  this.y = y;
  this.xAnimated = new Animated(x);
  this.yAnimated = new Animated(y);
  if (xSpeed != null && ySpeed != null)  {
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
  }
}


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
  let strokeWidth = this.game.viewScaleAnimated.value;
  let strokeColor = "rgba(127, 127, 127, 0.25)";

  for(x = gridSpace / 2; x < this.game.mapWidth; x += gridSpace)  {
    let realX = this.game.convertCoords(x)[0];
    this.ctx.beginPath();
    this.ctx.moveTo(realX, realLT[1]);
    this.ctx.lineTo(realX, realRB[1]);
    this.ctx.closePath();
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.stroke();
  }
  for(y = gridSpace / 2; y < this.game.mapHeight; y += gridSpace)  {
    let realY = this.game.convertCoords(0, y)[1];
    this.ctx.beginPath();
    this.ctx.moveTo(realLT[0], realY);
    this.ctx.lineTo(realRB[0], realY);
    this.ctx.closePath();
    this.ctx.lineWidth = strokeWidth;
    this.ctx.strokeStyle = strokeColor;
    this.ctx.stroke();
  }
}

Canvas.prototype.drawSlime = function(slime)  {
  let scrCoords = this.game.convertCoords(slime.xAnimated.value, slime.yAnimated.value);
  let x = scrCoords[0], y = scrCoords[1], img = slime.parent.img;
  let diameter = slime.diameterAnimated.value;

  if (diameter > 0)  {

    //DEFAULT SLIME
    if (img === null)  {
      let fill = new Path2D();
      let border = new Path2D();
      this.ctx.globalAlpha = slime.opacity;
      this.ctx.lineWidth = this.game.borderWidth * this.game.viewScaleAnimated.value;
      this.ctx.strokeStyle = slime.borderColor;
      this.ctx.fillStyle = slime.color;
      fill.arc(x, y, (diameter/2 + this.game.borderWidth) * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
      this.ctx.fill(fill);
      border.arc(x, y, (diameter + this.game.borderWidth)/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
      this.ctx.stroke(border);

      //NICKNAME

      if (slime.parent.nickname != null)  {
        nickname = slime.parent.nickname.slice(0, 26);
        let fontSize = Math.max(0.16 * diameter, 15) * this.game.viewScaleAnimated.value;
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
      this.ctx.globalAlpha = 1;
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

Canvas.prototype.drawFood = function(food)  {
  let scrCoords = this.game.convertCoords(food.xAnimated.value, food.yAnimated.value);
  let x = scrCoords[0], y = scrCoords[1];
  let diameter = food.diameterAnimated.value;

  //DEFAULT FOOD
  if (animal == undefined)  {
    let fill = new Path2D();
    let border = new Path2D();
    this.ctx.globalAlpha = food.opacity.value;
    this.ctx.lineWidth = this.game.borderWidth * this.game.viewScaleAnimated.value;
    this.ctx.strokeStyle = food.borderColor;
    this.ctx.fillStyle = food.color;
    fill.arc(x, y, (diameter/2 + this.game.borderWidth) * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
    this.ctx.fill(fill);
    border.arc(x, y, (diameter + this.game.borderWidth)/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
    this.ctx.stroke(border);
    this.ctx.globalAlpha = 1;
  }
  //CUSTOM FOOD
  else if (animal == "dog")  {
    let scrDiameter = (diameter + this.game.borderWidth * 2) * this.game.viewScaleAnimated.value;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(food.rotation);
    this.ctx.scale(scrDiameter * 1.3, scrDiameter * 1.3);
    this.ctx.translate(-0.21, -0.5);

    this.ctx.globalAlpha = food.opacity.value;
    this.ctx.fillStyle = food.color;
    let fill = new Path2D(bonePath);
    this.ctx.fill(fill);
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }
}

Canvas.prototype.drawCactus = function(cactus)  {
  let scrCoords = this.game.convertCoords(cactus.xAnimated.value, cactus.yAnimated.value);
  let x = scrCoords[0], y = scrCoords[1];
  let diameter = cactus.diameterAnimated.value;

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


let Game = function()  {
	gameObjInitialized = false;

	//DEFAULT SETTINGS
	this.canvas = canvas;
	this.frameRate = 60;
	this.borderWidth = 7;
	this.startDiameter = 40;
	this.maxParts = 16;
	this.minSplitMass = 60;
	this.splitSpeed = 15;
	this.splitSlowness = 0.01;
	this.mergeTime = 30;
	this.mergeTimeGrow = 0.08;
	this.repulsingSpeed = 60;
	this.minEjectMass = 44 * 2;
	this.ejectSpeed = 30;
	this.ejectSlowness = 0.03;
	this.ejectMassLoss = 44;
	this.ejectMass = 39;
	this.foodDiameter = 8;
	this.foodsPer100sqpx = 0.7;
	this.foodsSpawnPerSec = 3;
	this.spawnPreFood = true;
	this.preFoodPart = 0.5;
	this.cactusMass = 280;
	this.cactusMaxMass = 560;
	this.cactusSplitSpeed = 46;
	this.cactusSplitSlowness = 0.055;
	this.cactusesPer100sqpx = 0.0015;
	this.cactusesSpawnPerSec = 0.2;
	this.spawnPreCactuses = true;
	this.preCactusesPart = 1;
	this.explodeMassFactor = 0.03;
	this.distanceToEat = 3/5;
	this.massToEat = 0.75;
	this.mapWidth = 10000;
	this.mapHeight = 10000;
	this.lightBackgroundColor = "hsl(180, 100%, 96%)";
	this.darkBackgroundColor = "hsl(300, 100%, 4%)";
	this.letCustomImages = false;

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
	            this.startDiameter,
	            "hsl("+playerColor+", 100%, 50%)",
	            "hsl("+playerColor+", 100%, 40%)",
	            this.mapWidth / 2,
	            this.mapHeight / 2);

	let mouseC = this.convertCoords(this.mapWidth / 2, this.mapHeight / 2);
	this.mouseX = mouseC[0];
	this.mouseY = mouseC[1];

	gameObjInitialized = true;
}

Game.prototype.convertCoords = function(x, y)  {
  let camLeft = this.camXanimated.value - this.canvas.width / 2 / this.viewScaleAnimated.value;
  let camTop = this.camYanimated.value - this.canvas.height / 2 / this.viewScaleAnimated.value;
  let canvasX = (x - camLeft) * this.viewScaleAnimated.value;
  let canvasY = (y - camTop) * this.viewScaleAnimated.value;
  return [canvasX, canvasY];
};

Game.prototype.getMass = function(diameter)  {
  return Math.pow(diameter / 2, 2) * Math.PI / 100;
}

Game.prototype.getDiameter = function(mass)  {
  return Math.sqrt(mass * 100 / Math.PI) * 2;
}

Game.prototype.getDistance = function(x1, y1, x2, y2)  {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

Game.prototype.getDistanceBetween = function(distance, diameter1, diameter2)  {
  return distance - (diameter1 + diameter2 + this.borderWidth*4) / 2;
}

Game.prototype.moveObject = function(object, diffX, diffY, animationTime = 0)  {
  object.x += diffX;
  object.y += diffY;
  object.xAnimated.animate(object.x, animationTime);
  object.yAnimated.animate(object.y, animationTime);
}

Game.prototype.spawnFood = function()  {
  let x = randNum(0, this.mapWidth);
  let y = randNum(0, this.mapHeight);
  let hue = randNum(0, 360);
  let color = "hsl("+hue+", 100%, 50%)";
  this.foods.push(new Food(this.foodDiameter, color, color, this.borderWidth, x, y, 2));
};

Game.prototype.spawnCactus = function()  {
  let x, y, valid, diameter = this.getDiameter(this.cactusMass), i = 0;
  do {
    x = randNum(0, this.mapWidth);
    y = randNum(0, this.mapHeight);
    valid = this.player.parts.every(function(part) {
      return this.getDistanceBetween(
        this.getDistance(part.x, part.y, x, y),
        part.diameter, diameter) > 200;
    }.bind(this));
    i++;
  }  while (!valid && i < 1000)
  let color = "hsl(108, 100%, 50%)";
  let borderColor = "hsl(108, 100%, 40%)";
  this.cactuses.push(new Cactus(diameter, color, borderColor, x, y));
};

Game.prototype.clearOutsideElements = function()  {
  [this.foods, this.ejectedFoods, this.ejectedMovingFoods, this.cactuses].forEach(function(elements)  {
    elements = elements.filter(element =>
      (element.x <= this.mapWidth && element.x >= 0) && (element.y <= this.mapHeight && element.y >= 0)
    );
  });
};

Game.prototype.moveInsideBorder = function(object)  {
  let newX = object.x < 0 ? 0 : object.x > this.mapWidth ? this.mapWidth : object.x;
  let newY = object.y < 0 ? 0 : object.y > this.mapHeight ? this.mapHeight : object.y;
  this.moveObject(object, newX - object.x, newY - object.y);
  if (object.x == 0 || object.x == this.mapWidth)  {
    if (object.xSpeed != undefined)
      object.xSpeed = 0;
    if (object.xExtraSpeed != undefined)
      object.xExtraSpeed = 0;
  }
  if (object.y == 0 || object.y == this.mapWidth)  {
    if (object.ySpeed != undefined)
      object.ySpeed = 0;
    if (object.yExtraSpeed != undefined)
      object.yExtraSpeed = 0;
  }
};

Game.prototype.repulse = function(part, otherPart, timeDifference)  {
  let distance = this.getDistance(part.x, part.y, otherPart.x, otherPart.y);
  let distanceBetween = this.getDistanceBetween(distance, part.diameter, otherPart.diameter);
  if (distanceBetween < 0 && distance != 0)  {
    let xFactor = (part.x - otherPart.x) / distance;
    let yFactor = (part.y - otherPart.y) / distance;
    let xDifference = xFactor * (-distanceBetween);
    let yDifference = yFactor * (-distanceBetween);
    let xChange = timeDifference / 100 * xFactor * this.repulsingSpeed;
    let yChange = timeDifference / 100 * yFactor * this.repulsingSpeed;
    if (Math.abs(xChange) > Math.abs(xDifference) || Math.abs(yChange) > Math.abs(yDifference))  {
      xChange = xDifference;
      yChange = yDifference;
    }
    if (part.speed == undefined)  {
      part.speed = 1;
    }
    if (otherPart.speed == undefined)  {
      otherPart.speed = 1;
    }
    let totalSpeed = part.speed + otherPart.speed;
    part.x += xChange * part.speed / totalSpeed;
    part.y += yChange * part.speed / totalSpeed;
    otherPart.x -= xChange * otherPart.speed / totalSpeed;
    otherPart.y -= yChange * otherPart.speed / totalSpeed;
  }
  this.moveInsideBorder(part);
  this.moveInsideBorder(otherPart);
};

Game.prototype.removeSlime = function(slime, parentArray, eatenBy = undefined)  {
  if (eatenBy != undefined)  {
    this.removedSlimes.push(slime);
    let distance = Math.sqrt(Math.pow(slime.x - eatenBy.x, 2) + Math.pow(slime.y - eatenBy.y, 2));
    let x = eatenBy.x + (slime.x - eatenBy.x) / distance * Math.max((eatenBy.diameter / 2 - slime.diameter * 2), 0);
    let y = eatenBy.y + (slime.y - eatenBy.y) / distance * Math.max((eatenBy.diameter / 2 - slime.diameter * 2), 0);
    slime.xAnimated.animate(x, 200, easeIn);
    slime.yAnimated.animate(y, 200, easeIn);
    slime.opacity.animate(0, 150, easeIn);
    slime.diameterAnimated.animate(0, 150, easeIn);
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
  for(let i = 0; i < this.mapWidth*this.mapHeight/10000 * this.foodsPer100sqpx * this.preFoodPart; i++)  {
    this.spawnFood();
  }
  for(let i = 0; i < this.mapWidth*this.mapHeight/10000 * this.cactusesPer100sqpx * this.preCactusesPart; i++)  {
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

  this.latestRenderTime = Date.now();
  this.render();
}

Game.prototype.pause = function()  {
	this.paused = true;
}

Game.prototype.resume = function()  {
	this.paused = false;
	this.player.lastPosUpdate = Date.now();
	this.render();
}


Game.prototype.render = function()	{
	if (this.paused)  {
		return 0;
	}
	let startTime = Date.now();


	//SPAWN FOODS
	{
	this.noFoodSpawningTime += startTime - this.latestRenderTime;
	let nfst = this.noFoodSpawningTime / 1000;
	let interval = 1 / this.foodsSpawnPerSec;
	if (nfst > interval)  {
	  while(nfst > interval)  {
	    if (this.foods.length < this.mapWidth*this.mapHeight / (100*100) * this.foodsPer100sqpx)  {
	      this.spawnFood();
	    }
	    this.noFoodSpawningTime -= interval * 1000;
	    nfst = this.noFoodSpawningTime / 1000;
	  }
	}
	}


	//SPAWN CACTUSES
	{
	this.noCactusSpawningTime += startTime - this.latestRenderTime;
	let ncst = this.noCactusSpawningTime / 1000;
	let interval = 1 / this.cactusesSpawnPerSec;
	if (ncst > interval)  {
	  while(ncst > interval)  {
	    if (this.cactuses.length < this.mapWidth*this.mapHeight / (100*100) * this.cactusesPer100sqpx)  {
	      this.spawnCactus();
	    }
	    this.noCactusSpawningTime -= interval * 1000;
	    ncst = this.noCactusSpawningTime / 1000;
	  }
	}
	}

	//REMOVE REMOVED SLIMES
	this.removedSlimes.forEach(function(slime)  {
	if (slime.opacity.value == 0)  {
	  this.removedSlimes.splice(this.removedSlimes.indexOf(slime), 1);
	}
	}.bind(this));

	//UPDATE PLAYER POSITIONS

	let tempLastPosUpdate = Date.now(), timeDifference = tempLastPosUpdate - this.player.lastPosUpdate;
	{
	this.player.parts.forEach(function(part) {

	  let partCanvasCoords = this.convertCoords(part.x, part.y);
	  let mouseXoffset = this.mouseX - partCanvasCoords[0];
	  let mouseYoffset = this.mouseY - partCanvasCoords[1];
	  let minSize = Math.min(this.canvas.width, this.canvas.height);
	  let preDistance = Math.sqrt(Math.pow(mouseXoffset, 2) + Math.pow(mouseYoffset, 2)) / minSize;
	  if (preDistance == 0 || preDistance == NaN)  {
	    preDistance = 1;
	  }
	  let distance = preDistance < 0.1 ? 0.1 * minSize : preDistance * minSize;
	  part.mouseXfactor = mouseXoffset / (preDistance * minSize);
	  part.mouseYfactor = mouseYoffset / (preDistance * minSize);


	  if (preDistance > 0.02)  {
	    part.xMove = (mouseXoffset / distance) * part.speed * timeDifference / 15;
	    part.yMove = (mouseYoffset / distance) * part.speed * timeDifference / 15;

	    this.moveObject(
	      part,
	      part.xMove + part.xExtraSpeed * timeDifference / 30,
	      part.yMove + part.yExtraSpeed * timeDifference / 30
	    );
	  }
	  else  {
	    this.moveObject(
	      part,
	      part.xExtraSpeed * timeDifference / 30,
	      part.yExtraSpeed * timeDifference / 30
	    )
	  }

	  let esDistance = Math.sqrt(Math.pow(part.xExtraSpeed, 2) + Math.pow(part.yExtraSpeed, 2))

	  if (part.xExtraSpeed > 0)        part.xExtraSpeed = Math.max(part.xExtraSpeed - (part.xExtraSpeed / esDistance * timeDifference * game.splitSlowness), 0);
	  else if (part.xExtraSpeed < 0)   part.xExtraSpeed = Math.min(part.xExtraSpeed - (part.xExtraSpeed / esDistance * timeDifference * game.splitSlowness), 0);

	  if (part.yExtraSpeed > 0)        part.yExtraSpeed = Math.max(part.yExtraSpeed - (part.yExtraSpeed / esDistance * timeDifference * game.splitSlowness), 0);
	  else if (part.yExtraSpeed < 0)   part.yExtraSpeed = Math.min(part.yExtraSpeed - (part.yExtraSpeed / esDistance * timeDifference * game.splitSlowness), 0);

	  let xBefore = part.x;
	  let yBefore = part.y;

	  this.moveInsideBorder(part);

	  part.xMove += xBefore - part.x;
	  part.yMove += yBefore - part.y;

	}.bind(this));

	//PARTS MERGING

	let mergeDone = false;
	this.player.mergeTimeLeft -= timeDifference / 1000;
	let mergingParts = this.player.parts.filter(part => this.player.mergeTimeLeft + part.diameter * this.mergeTimeGrow <= 0)
	                                    .sort((a, b) => b.diameter - a.diameter);
	let tempMergingParts = [...mergingParts];

	while  (tempMergingParts.length > 1)  {
	  part = tempMergingParts[0];
	  toMergeParts = tempMergingParts.filter(otherPart => part != otherPart && otherPart.diameter <= part.diameter)
	  .filter(function(otherPart)  {
	    let distance = this.getDistance(part.x, part.y, otherPart.x, otherPart.y);
	    let distanceBetween = this.getDistanceBetween(distance, part.diameter, otherPart.diameter);
	    return -distanceBetween > otherPart.diameter * this.distanceToEat;
	  }.bind(this)).forEach(function(otherPart)  {
	    part.addMass(this.getMass(otherPart.diameter));
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
	    this.repulse(part, otherPart, timeDifference);
	  }.bind(this));
	}.bind(this));

	if (this.repulsingFoodsCount !== 0 || this.ejectedMovingFoods.length > 0)  {
	  let ejectedFoods = [...this.ejectedFoods, ...this.ejectedMovingFoods];
	  this.repulsingFoodsCount = 0;
	  ejectedFoods.forEach(function(ejectedFood)  {
	    ejectedFoods.filter(otherEjectedFood => otherEjectedFood != ejectedFood).forEach(function(otherEjectedFood)  {
	      let distance = this.getDistance(ejectedFood.x, ejectedFood.y, otherEjectedFood.x, otherEjectedFood.y);
	      if (this.getDistanceBetween(distance, ejectedFood.diameter, otherEjectedFood.diameter) < -1)  {
	        this.repulse(ejectedFood, otherEjectedFood, timeDifference);
	        this.repulsingFoodsCount += 1;
	      }
	    }.bind(this));
	  }.bind(this));
	}

	//CAMERA MOVE

	this.camX = this.player.parts.reduce((total, next) => total + next.x, 0) / this.player.parts.length;
	this.camY = this.player.parts.reduce((total, next) => total + next.y, 0) / this.player.parts.length;

	if (mergeDone)  {
	  this.camXanimated.animate(this.camX, 500, easeOut);
	  this.camYanimated.animate(this.camY, 500, easeOut);
	}
	else  {
	  this.camXanimated.animate(this.camX, 0, linear);
	  this.camYanimated.animate(this.camY, 0, linear);
	}

	this.player.lastPosUpdate = tempLastPosUpdate;


	}

	//MOVING FOODS AND CACTUSES

	[...this.ejectedMovingFoods, ...this.cactuses].forEach(function(movingObject)  {
	if (movingObject.xSpeed != 0 || movingObject.ySpeed != 0)  {
	  this.moveObject(
	    movingObject,
	    movingObject.xSpeed * timeDifference / 30,
	    movingObject.ySpeed * timeDifference / 30
	  );

	  let slowness = movingObject.type == "Cactus" ? this.cactusSplitSlowness : this.ejectSlowness;

	  let esDistance = Math.sqrt(Math.pow(movingObject.xSpeed, 2) + Math.pow(movingObject.ySpeed, 2))

	  if (movingObject.xSpeed > 0)        movingObject.xSpeed = Math.max(movingObject.xSpeed - (movingObject.xSpeed / esDistance * timeDifference * slowness), 0);
	  else if (movingObject.xSpeed < 0)   movingObject.xSpeed = Math.min(movingObject.xSpeed - (movingObject.xSpeed / esDistance * timeDifference * slowness), 0);

	  if (movingObject.ySpeed > 0)        movingObject.ySpeed = Math.max(movingObject.ySpeed - (movingObject.ySpeed / esDistance * timeDifference * slowness), 0);
	  else if (movingObject.ySpeed < 0)   movingObject.ySpeed = Math.min(movingObject.ySpeed - (movingObject.ySpeed / esDistance * timeDifference * slowness), 0);

	  this.moveInsideBorder(movingObject);

	  if (movingObject.xSpeed == 0 && movingObject.ySpeed == 0 && this.ejectedMovingFoods.indexOf(movingObject) != -1)  {
	    this.ejectedFoods.push(movingObject);
	    this.ejectedMovingFoods.splice(this.ejectedMovingFoods.indexOf(movingObject), 1);
	  }
	}
	}.bind(this));


	//EATING FOODS

	this.player.parts.forEach(function(part) {
	[...this.foods, ...this.ejectedFoods, ...this.ejectedMovingFoods].filter(function(food)  {
	  let partRadius = part.diameter / 2 + this.borderWidth;
	  let distance = Math.sqrt(
	    Math.pow(Math.abs(food.x - part.x), 2) +
	    Math.pow(Math.abs(food.y - part.y), 2));
	  return distance < partRadius + food.diameter / 2 - food.diameter * this.distanceToEat;
	}.bind(this)).forEach(function(food)  {
	  part.addMass(food.kcal);
	  let index;
	  let parentArray = [this.foods, this.ejectedFoods, this.ejectedMovingFoods].find(array => (index = array.indexOf(food)) != -1);
	  this.removeSlime(food, parentArray, part);
	}.bind(this));
	}.bind(this));

	this.player.parts.sort((a, b) => a.diameter - b.diameter);
	this.player.updateScore();


	//EATING CACTUSES

	this.player.parts.forEach(function(part)  {
	this.cactuses.forEach(function(cactus)  {
	  let distance = this.getDistance(part.x, part.y, cactus.x, cactus.y);
	  let distanceBetween = this.getDistanceBetween(distance, part.diameter, cactus.diameter);
	  if (
	    -distanceBetween > cactus.diameter * this.distanceToEat
	    && this.getMass(cactus.diameter) < this.getMass(part.diameter) * this.massToEat
	  )  {
	    part.explode(this.getMass(cactus.diameter));
	    this.removeSlime(cactus, this.cactuses, part);
	  }
	}.bind(this));
	}.bind(this));


	//CACTUSES EATING FOODS

	this.cactuses.forEach(function(cactus)  {
	this.ejectedMovingFoods.forEach(function(ejectedFood)  {
	  let distanceBetween = this.getDistanceBetween(
	    this.getDistance(cactus.x, cactus.y, ejectedFood.x, ejectedFood.y),
	    cactus.diameter, ejectedFood.diameter
	  );
	  if (-distanceBetween > ejectedFood.diameter * this.distanceToEat)  {
	    cactus.addMass(ejectedFood.kcal);
	    this.removeSlime(ejectedFood, this.ejectedMovingFoods, cactus)
	    if (this.getMass(cactus.diameter) > this.cactusMaxMass)  {
	      let speed = this.getDistance(0, 0, ejectedFood.xSpeed, ejectedFood.ySpeed);
	      cactus.setMass(this.getMass(cactus.diameter) / 2);
	      this.cactuses.push(new Cactus(
	        cactus.diameter,
	        cactus.color,
	        cactus.borderColor,
	        cactus.x, cactus.y,
	        ejectedFood.xSpeed / speed * this.cactusSplitSpeed,
	        ejectedFood.ySpeed / speed * this.cactusSplitSpeed
	      ));
	    }
	  }
	}.bind(this));
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

	this.removedSlimes.forEach(function(removedSlime)  {
	if (removedSlime.type == "Cactus")  {
	  this.canvas.drawCactus(removedSlime);
	}
	else if (removedSlime.type == "SlimePart") {
	  this.canvas.drawSlime(removedSlime);
	}
	else  {
	  this.canvas.drawFood(removedSlime);
	}
	}.bind(this));


	//RENDER FOODS

	[...this.foods, ...this.ejectedFoods, ...this.ejectedMovingFoods].filter(function(food)  {
	let canvasCoords = this.convertCoords(food.x, food.y);
	let foodRadius = food.diameter / 2 + this.borderWidth;

	return canvasCoords[0] > 0 - foodRadius && canvasCoords[0] < this.canvas.width + foodRadius
	    && canvasCoords[1] > 0 - foodRadius && canvasCoords[1] < this.canvas.height + foodRadius;
	}.bind(this)).forEach(function(food) {
	this.canvas.drawFood(food);
	}.bind(this));


	//RENDER PLAYER, OTHER SLIMES AND CACTUSES
	{
	let slimes = [...this.player.parts, ...this.cactuses];
	slimes.sort((a, b) => a.diameter - b.diameter);
	slimes.forEach(function(slime) {
	  if (slime.type == "SlimePart")  {
	    this.canvas.drawSlime(slime);
	  } else if (slime.type == "Cactus")  {
	    this.canvas.drawCactus(slime);
	  }
	}.bind(this));
	}

	//UPDATE VIEW SCALE
	{
	let minSize = Math.min(this.canvas.width, this.canvas.height) / this.canvas.ratio;
	let newViewScale = Math.min(  3 / Math.pow(this.player.diameterSum, 10/40),			minSize / this.player.diameterSum / 2  )
	 * Math.pow(0.9, Math.log(this.player.parts.length)) * this.canvas.ratio;
	if (newViewScale != this.viewScale)  {
	  this.viewScale = newViewScale;
	  this.viewScaleAnimated.animate(this.viewScale, 700, easeOut);
	}
	}

	//GUI INTERACT

	if (gui != undefined)  {
	gui.massCounter.innerHTML = this.player.score;
	}

	this.latestRenderTime = startTime;
	setTimeout(this.render.bind(this), 1000 / game.frameRate - (Date.now() - startTime));
}
