let randNum = function(min, max)  {
  return min + Math.floor(Math.random() * (max - min + 1));
}


//ANIMATIONS

let Animated = function(value)  {
  this.value = value;
  this.animCount = 0;
}

let linear = new BezierCurve(2, 1, [0, 0], [1, 1]);
let ease = new BezierCurve(30, 3, [0, 0], [0.5, 0], [0.5, 1], [1, 1]);
let easeOut = new BezierCurve(30, 3, [0, 0], [0, 0], [0.5, 1], [1, 1]);

Animated.prototype.animate = function(valueChange, time, timingFunction = ease, delay = 0)  {
  let i = 1;
  let maxI = Math.round(time / (1000 / game.frameRate));
  this.animCount += 1;
  let frame = function()  {
    if (maxI > 1)  {
      this.value += valueChange * (    timingFunction.getYofX(i / (maxI-1)) - timingFunction.getYofX((i-1) / (maxI-1))   );
    }  else  {
      this.value += valueChange;
    }
    i++
    if (i < maxI)  {
      setTimeout(frame, 1000 / game.frameRate);
    }
  }.bind(this)
  if (delay <= 0)
    frame();
  else
    setTimeout(frame, delay);
}


let SlimePart = function(diameter, x, y, xExtraSpeed = 0, yExtraSpeed = 0, xMove = 0, yMove = 0)  {
  this.diameter =	diameter;
  this.diameterAnimated = new Animated(diameter);
  this.score = Math.floor(Math.pow(diameter/2, 2) * Math.PI / 100);
  this.speed = Math.pow(this.diameter, 10/17) / this.diameter * 20;
  this.xExtraSpeed = xExtraSpeed;
  this.yExtraSpeed = yExtraSpeed;
	this.x = x;
	this.y = y;
  this.xMove = xMove;
  this.yMove = yMove;

  this.updateDiameter = function(diameter)  {
    this.diameterAnimated.animate(diameter - this.diameter, 700, easeOut);
    this.diameter = diameter;
    this.score = Math.floor(Math.pow(diameter/2, 2) * Math.PI / 100);
    this.speed = 25 / Math.pow(this.diameter, 10/25);
  };

  this.reduceTimeToSplit = function(timeMS)  {
    let time = timeMS / 1000;
    this.timeToSplit -= time / Math.max(1, this.diameter / 1000);
  };
}


let Slime = function(diameter, color, borderColor, x, y)  {
  this.parts = [new SlimePart(diameter, x, y)];
  this.score = Math.floor(Math.pow(diameter/2, 2) * Math.PI / 100);
  this.diameterSum = diameter;
	this.color = color;
	this.borderColor = borderColor;
  this.mergeTimeLeft = 0;
  this.lastPosUpdate = Date.now();
  this.updateScore = function()  {
    let sqArea = this.parts.reduce((total, next) => total + Math.pow(next.diameter/2, 2), 0);
    this.score = Math.floor(sqArea * Math.PI / 100);
    this.diameterSum = Math.sqrt(sqArea) * 2;
  };
  this.split = function()  {
    if (this.parts.length < game.playerMaxParts)  {
      this.mergeTimeLeft = game.mergeTime;
      this.parts.filter(part => part.score >= game.minSplitScore).forEach(function(part)  {
        if (this.parts.length < game.playerMaxParts)  {
          part.updateDiameter(Math.sqrt(Math.pow(part.diameter, 2) / 2));
          this.parts.push(new SlimePart(
            part.diameter, part.x, part.y,
            part.xMove + part.mouseXfactor * game.splitSpeed,    part.yMove + part.mouseYfactor * game.splitSpeed,
            part.xMove, part.yMove));
        }
      }.bind(this));
    }
  };
}


let Food = function(diameter, color, borderWidth, x, y, kcal = "auto")		{
  this.diameter = diameter;
  if (kcal == "auto")
    this.kcal = Math.pow(this.diameter, 2);
  else if (kcal == "withBorder")
    this.kcal = Math.pow(this.diameter+borderWidth, 2);
  else
    this.kcal = kcal;
  this.color = color;
  this.borderColor = color;
  this.x = x;
  this.y = y;
}


let Canvas = function(game) {
  this.game = game;
  this.el = document.getElementById("game");
  this.el.style.display = "block";
  this.ctx = this.el.getContext("2d");

  this.resize = function(width = window.innerWidth, height = window.innerHeight)  {
    this.el.width = this.width = width;
    this.el.height = this.height = height;
    this.el.style.width = width + "px";
    this.el.style.height = height + "px";
  };

  this.resize();

  this.clear = function()  {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  this.renderGrid = function()  {
    let realLT = this.game.convertCoords(0, 0);
    let realRB = this.game.convertCoords(this.game.mapWidth, this.game.mapHeight);
    let strokeWidth = this.game.viewScaleAnimated.value;
    let strokeColor = "rgba(127, 127, 127, 0.15)";

    for(x = 25; x < this.game.mapWidth; x += 50)  {
      let realX = this.game.convertCoords(x)[0];
      this.ctx.beginPath();
      this.ctx.moveTo(realX, realLT[1]);
      this.ctx.lineTo(realX, realRB[1]);
      this.ctx.closePath();
      this.ctx.lineWidth = strokeWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
    }
    for(y = 25; y < this.game.mapHeight; y += 50)  {
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

  this.drawSlime = function(diameter, color, borderColor, x, y)  {
    let slime = new Path2D();
    if (diameter > this.game.borderWidth)  {
      slime.arc(x, y, diameter/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
      this.ctx.lineWidth = this.game.borderWidth*2 * this.game.viewScaleAnimated.value;
      this.ctx.strokeStyle = borderColor;
      this.ctx.fillStyle = color;
      this.ctx.stroke(slime);
      this.ctx.fill(slime);
    }
    else  {
      let border = new Path2D();
      slime.arc(x, y, diameter/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
      border.arc(x, y, (diameter/2 + this.game.borderWidth) * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
      this.ctx.fillStyle = borderColor;
      this.ctx.fill(border);
      this.ctx.fillStyle = color;
      this.ctx.fill(slime);
    }
  };

  this.drawPlayerScore = function(score)  {
    let rPCoords = this.game.convertCoords(
      this.game.player.parts[this.game.player.parts.length-1].x,
      this.game.player.parts[this.game.player.parts.length-1].y
    );
    let fontSize = 24;
    this.ctx.font = "bold "+fontSize+"px Ubuntu, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.lineWidth = fontSize / 6;
    this.ctx.lineJoin = "round";
    this.ctx.fillStyle = "rgb(255, 255, 255)";
    this.ctx.strokeText(score, rPCoords[0], rPCoords[1]);
    this.ctx.fillText(score, rPCoords[0], rPCoords[1]);
  };
}


let Game = function()  {
  this.canvas = new Canvas(this);
  this.frameRate = 60;
  this.playerStartDiameter = 40;
  this.playerMaxParts = 16;
  this.minSplitScore = 60;
  this.splitSpeed = 12;
  this.mergeTime = 25;
  this.mergeTimeGrow = 0.08;
  this.partsRepulsingSpeed = 15;
  this.noFoodSpawningTime = 0;
  this.borderWidth = 7;
	this.foodDiameter = 22;
	this.foodsPer100sqrpx = 0.7;
	this.spawnFoodPerSec = 3;
	this.spawnPreFood = true;
  this.preFoodPart = 0.5;
	this.mapWidth = 3000;
	this.mapHeight = 3000;
  this.viewScale = 1;
  this.viewScaleAnimated = new Animated(this.viewScale);
  this.scoreFontSize = 24;
	this.scoreOutlineSize = 2;
  this.camX = this.mapWidth / 2;
  this.camY = this.mapHeight / 2;
  this.camXanimated = new Animated(this.camX);
  this.camYanimated = new Animated(this.camY);
  this.foods = [];
  let playerColor = randNum(0, 360);
  this.player = new Slime(
                this.playerStartDiameter,
                "hsl("+playerColor+", 100%, 50%)",
                "hsl("+playerColor+", 100%, 40%)",
                this.mapWidth / 2,
                this.mapHeight / 2);

  this.convertCoords = function(x, y)  {
    let camLeft = this.camXanimated.value - this.canvas.width / 2 / this.viewScaleAnimated.value;
    let camTop = this.camYanimated.value - this.canvas.height / 2 / this.viewScaleAnimated.value;
    let canvasX = (x - camLeft) * this.viewScaleAnimated.value;
    let canvasY = (y - camTop) * this.viewScaleAnimated.value;
    return [canvasX, canvasY];
  };
  let mouseC = this.convertCoords(this.mapWidth / 2, this.mapHeight / 2);
	this.mouseX = mouseC[0];
	this.mouseY = mouseC[1];

  this.spawnFood = function()  {
    let x = randNum(0, this.mapWidth);
    let y = randNum(0, this.mapHeight);
    let color = "hsl("+randNum(0, 360)+", 100%, 50%)";

    this.foods.push(new Food(this.foodDiameter - this.borderWidth*2, color, this.borderWidth, x, y, 15*15));
  }

  this.clearOutsideFood = function()  {
    this.foods = this.foods.filter(food =>
      (food.x <= this.mapWidth && food.x >= 0) && (food.y <= this.mapHeight && food.y >= 0)
    );
  }
}


let darkMode = 0;
let game = new Game();



//INITIALIZE AND RENDER


Game.prototype.initialize = function()  {
  for(let i = 0; i < this.mapWidth*this.mapHeight/10000 * this.foodsPer100sqrpx * this.preFoodPart; i++)  {
    this.spawnFood();
  }
  this.canvas.resize();
  this.latestRenderTime = Date.now();
  this.render();
}


Game.prototype.render = function()  {
  let startTime = Date.now();


  this.canvas.clear();
  if (darkMode % 2 == 1)  {
    this.canvas.ctx.fillStyle = "rgb(0, 0, 0)";
    this.canvas.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  } else  {
    this.canvas.ctx.fillStyle = "rgb(255, 255, 255)";
    this.canvas.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  this.canvas.renderGrid();


  //SPAWN FOODS


  this.noFoodSpawningTime += startTime - this.latestRenderTime;
  let nfst = this.noFoodSpawningTime / 1000;
  let interval = 1 / this.spawnFoodPerSec;
  if (nfst > interval)  {
    while(nfst > interval)  {
      if (game.foods.length < game.mapWidth*game.mapHeight / (100*100) * game.foodsPer100sqrpx)  {
        game.spawnFood();
      }
      this.noFoodSpawningTime -= interval * 1000;
      nfst = this.noFoodSpawningTime / 1000;
    }
  }


  //RENDER FOODS


  this.foods.filter(function(food)  {
    let canvasCoords = this.convertCoords(food.x, food.y);
    let foodRadius = food.diameter / 2 + this.borderWidth;

    return canvasCoords[0] > 0 - foodRadius && canvasCoords[0] < this.canvas.width + foodRadius
        && canvasCoords[1] > 0 - foodRadius && canvasCoords[1] < this.canvas.height + foodRadius;
  }.bind(this)).forEach(function(food) {
    let canvasCoords = this.convertCoords(food.x, food.y);
    this.canvas.drawSlime(food.diameter, food.color, food.borderColor, canvasCoords[0], canvasCoords[1]);
  }.bind(this));


  //EATING FOODS


  this.player.parts.forEach(function(part) {
    this.foods.filter(function(food)  {
      let partRadius = part.diameter / 2 + this.borderWidth;
      let distance = Math.sqrt(
        Math.pow(Math.abs(food.x - part.x), 2) +
        Math.pow(Math.abs(food.y - part.y), 2));
      return distance < partRadius;
    }.bind(this)).forEach(function(food)  {
      part.updateDiameter(Math.sqrt(Math.pow(part.diameter, 2) + food.kcal));
      this.foods.splice(this.foods.indexOf(food), 1);
    }.bind(this));
  }.bind(this));

  this.player.parts.sort((a, b) => a.diameter - b.diameter);
  this.player.updateScore();


  //UPDATE PLAYER POSITIONS
  {
    let timeDifference = Date.now() - this.player.lastPosUpdate;

    this.player.parts.forEach(function(part) {

      let partCanvasCoords = this.convertCoords(part.x, part.y);
      let mouseXoffset = this.mouseX - partCanvasCoords[0];
      let mouseYoffset = this.mouseY - partCanvasCoords[1];
      let preDistance = Math.sqrt(Math.pow(mouseXoffset, 2) + Math.pow(mouseYoffset, 2));
      let distance = preDistance < 100 ? 100 : preDistance;
      part.mouseXfactor = mouseXoffset / preDistance;
      part.mouseYfactor = mouseYoffset / preDistance;


      if (preDistance > 10)  {
        part.xMove = (mouseXoffset / distance) * part.speed * timeDifference / 15;
        part.yMove = (mouseYoffset / distance) * part.speed * timeDifference / 15;

        part.x += part.xMove + part.xExtraSpeed;
        part.y += part.yMove + part.yExtraSpeed;
      }
      else  {
        part.x += part.xExtraSpeed;
        part.y += part.yExtraSpeed;
      }

      let esDistance = Math.sqrt(Math.pow(part.xExtraSpeed, 2) + Math.pow(part.yExtraSpeed, 2))

      if (part.xExtraSpeed > 0)        part.xExtraSpeed = Math.max(part.xExtraSpeed - (part.xExtraSpeed / esDistance * timeDifference / 100), 0);
      else if (part.xExtraSpeed < 0)   part.xExtraSpeed = Math.min(part.xExtraSpeed - (part.xExtraSpeed / esDistance * timeDifference / 100), 0);

      if (part.yExtraSpeed > 0)        part.yExtraSpeed = Math.max(part.yExtraSpeed - (part.yExtraSpeed / esDistance * timeDifference / 100), 0);
      else if (part.yExtraSpeed < 0)   part.yExtraSpeed = Math.min(part.yExtraSpeed - (part.yExtraSpeed / esDistance * timeDifference / 100), 0);

      let xBefore = part.x;
      let yBefore = part.y;

      part.x = part.x < 0 ? 0 : part.x > this.mapWidth ? this.mapWidth : part.x;
      part.y = part.y < 0 ? 0 : part.y > this.mapHeight ? this.mapHeight : part.y;

      part.xMove -= xBefore - part.x;
      part.yMove -= yBefore - part.y;

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
        let distance = Math.sqrt(Math.pow(part.x - otherPart.x, 2) + Math.pow(part.y - otherPart.y, 2));
        let distanceBetween = distance - (part.diameter + otherPart.diameter) / 2 - this.borderWidth*2;
        return -distanceBetween > otherPart.diameter * 2/3;
      }.bind(this)).forEach(function(otherPart)  {
        part.updateDiameter(Math.sqrt(Math.pow(part.diameter, 2) + Math.pow(otherPart.diameter, 2)));
        tempMergingParts.splice(tempMergingParts.indexOf(otherPart));
        this.player.parts.splice(this.player.parts.indexOf(otherPart), 1);
        mergeDone = true;
      }.bind(this));
      tempMergingParts.splice(tempMergingParts.indexOf(part), 1);
    }

    //PARTS REPULSING

    this.player.parts.filter(part => mergingParts.indexOf(part) == -1)
    .forEach(function(part)  {
      this.player.parts.filter(otherPart => part != otherPart)
      .forEach(function(otherPart)  {
        let distance = Math.sqrt(Math.pow(part.x - otherPart.x, 2) + Math.pow(part.y - otherPart.y, 2));
        let distanceBetween = distance - (part.diameter + otherPart.diameter) / 2 - this.borderWidth*2;
        if (distanceBetween < 0 && distance != 0)  {
          let xFactor = (part.x - otherPart.x) / distance;
          let yFactor = (part.y - otherPart.y) / distance;
          let xDifference = xFactor * (-distanceBetween);
          let yDifference = yFactor * (-distanceBetween);
          let xChange = xFactor * this.partsRepulsingSpeed;
          let yChange = yFactor * this.partsRepulsingSpeed;
          if (Math.abs(xChange) > Math.abs(xDifference))  {
            xChange = xDifference;
          }
          if (Math.abs(yChange) > Math.abs(yDifference))  {
            yChange = yDifference;
          }
          let totalSpeed = part.speed + otherPart.speed;
          part.x += xChange * part.speed / totalSpeed;
          part.y += yChange * part.speed / totalSpeed;
          otherPart.x -= xChange * otherPart.speed / totalSpeed;
          otherPart.y -= yChange * otherPart.speed / totalSpeed;
        }
      }.bind(this));
    }.bind(this));

    let newCamX = this.player.parts.reduce((total, next) => total + next.x, 0) / this.player.parts.length;
    let newCamY = this.player.parts.reduce((total, next) => total + next.y, 0) / this.player.parts.length;
    if (mergeDone)  {
      this.camXanimated.animate(newCamX - this.camX, 500, easeOut);
      this.camYanimated.animate(newCamY - this.camY, 500, easeOut);
    }
    else  {
      this.camXanimated.animate(newCamX - this.camX, 0, linear);
      this.camYanimated.animate(newCamY - this.camY, 0, linear);
    }
    this.camX = newCamX;
    this.camY = newCamY;

    this.player.lastPosUpdate = Date.now();


  }
  //RENDER PLAYER
  {

    this.player.parts.forEach(function(part) {
      let canvasCoords = this.convertCoords(part.x, part.y);
      this.canvas.drawSlime(part.diameterAnimated.value, this.player.color, this.player.borderColor, canvasCoords[0], canvasCoords[1]);
    }.bind(this));
    this.canvas.drawPlayerScore(this.player.score);

  }
  //UPDATE VIEW SCALE
  {

    let minSize = Math.min(this.canvas.width, this.canvas.height);
    let newViewScale = Math.min(  3 / Math.pow(this.player.diameterSum, 10/40),			minSize / this.player.diameterSum / 2  )
     * Math.pow(0.9, Math.log(this.player.parts.length));
    this.viewScaleAnimated.animate(newViewScale - this.viewScale, 700, ease);
    this.viewScale = newViewScale;

  }

  this.latestRenderTime = startTime;
  setTimeout(this.render.bind(this), 1000 / game.frameRate - (Date.now() - startTime));
}

//INITIALIZE GAME

game.initialize();






let touchMoveCount, focusedOnCanvas = true;
canvasFocusCheck = function(target)  {
  focusedOnCanvas = target == game.canvas.el;
}

game.canvas.el.addEventListener("mousemove", function(event) {
  game.mouseX = event.clientX;
  game.mouseY = event.clientY;
});
document.addEventListener("click", function(event)  {
  canvasFocusCheck(event.target);
});
document.addEventListener("touchstart", function(event) {
  canvasFocusCheck(event.target);
});
game.canvas.el.addEventListener("dblclick", function() {
  darkMode++;
});
game.canvas.el.addEventListener("touchstart", function(event) {
  if (event.touches.length < 2)  {
		event.preventDefault();
  }
  game.mouseX = event.touches[0].clientX;
  game.mouseY = event.touches[0].clientY;

  if (event.touches.length == 4)  {
    darkMode++;
  }
  else if (event.touches.length == 3)  {
    switchFullscreen();
  }
  else if (event.touches.length == 2)  {
    setTimeout(function() {
      if (touchMoveCount == 1)
      game.player.split();
    }, 300);
  }
});
game.canvas.el.addEventListener("touchmove", function(event) {
	if (event.touches.length < 2)  {
		event.preventDefault();
  }
  game.mouseX = event.touches[0].clientX;
  game.mouseY = event.touches[0].clientY;
  touchMoveCount = event.touches.length;
});
window.addEventListener("resize", function()  {
	game.canvas.resize();
});
document.addEventListener("keydown", function(event) {
  if (focusedOnCanvas)  {
    if (event.key == " ") {
      game.player.split();
    }
  }
});



//============ FULLSCREEN ===============

function switchFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement ||
    document.mozFullScreenElement)  {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
  }
  else  {
    elem = document.body;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }
}
