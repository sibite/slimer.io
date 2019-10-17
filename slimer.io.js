      let randNum = function(min, max)  {
        return min + Math.floor(Math.random() * (max - min + 1));
      }


      //ANIMATIONS

      let Animated = function(value)  {
        this.value = value;
        this.animCount = 0;
      }

      let ease = new BezierCurve(30, 3, [0, 0], [0.5, 0], [0.5, 1], [1, 1]);

      Animated.prototype.animate = function(valueChange, time)  {
        let i = 1;
        let maxI = Math.round(time / (1000 / game.frameRate));
        this.animCount += 1;
        let frame = function()  {
          if (maxI > 1)  {
            this.value += valueChange * (    ease.getYofX(i / (maxI-1)) - ease.getYofX((i-1) / (maxI-1))   );
          }  else  {
            this.value += valueChange;
          }
          i++
          if (i < maxI)  {
            setTimeout(frame, 1000 / game.frameRate);
          }
        }.bind(this)
        frame();
      }


			let Slime = function(diameter, color, borderColor, x, y)  {
				this.diameter =	diameter;
        this.score = Math.floor(Math.pow(diameter/2, 2) * Math.PI / 100);
				this.color = color;
				this.borderColor = borderColor;
				this.speed = Math.pow(this.diameter, 10/17) / this.diameter * 20;
				this.x = x;
				this.y = y;
        this.directionX = 0;
        this.directionY = 0;
        this.lastPosUpdate = Date.now();
        this.animatedDiameter = new Animated(diameter);

        this.updateDiameter = function(diameter)  {
          this.animatedDiameter.animate(diameter - this.diameter, 400);
          this.diameter = diameter;
          this.score = Math.floor(Math.pow(diameter/2, 2) * Math.PI / 100);
          this.speed = Math.pow(this.diameter, 10/17) / this.diameter * 20;
        }
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
          for(y = 25; y < this.game.mapWidth; y += 50)  {
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
          slime.arc(x, y, diameter/2 * this.game.viewScaleAnimated.value, 0, 2*Math.PI);
          this.ctx.lineWidth = this.game.borderWidth*2 * this.game.viewScaleAnimated.value;
          this.ctx.strokeStyle = borderColor;
          this.ctx.fillStyle = color;
          this.ctx.stroke(slime);
          this.ctx.fill(slime);
        };

        this.drawPlayerScore = function(score)  {
          let rPCoords = this.game.convertCoords(this.game.player.x, this.game.player.y);
          this.ctx.font = "bold 30px Ubuntu";
          this.ctx.textAlign = "center";
          this.ctx.textBaseline = "middle";
          this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
          this.ctx.lineWidth = 5;
          this.ctx.lineJoin = "round";
          this.ctx.fillStyle = "rgb(255, 255, 255)";
          this.ctx.strokeText(score, rPCoords[0], rPCoords[1]);
          this.ctx.fillText(score, rPCoords[0], rPCoords[1]);
        };
      }


			let Game = function()  {
        this.canvas = new Canvas(this);
        this.frameRate = 60;
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
        let playerColor = randNum(0, 360);
        this.player = new Slime(
                      40,
                      "hsl("+playerColor+", 100%, 50%)",
                      "hsl("+playerColor+", 100%, 40%)",
                      this.mapWidth / 2,
                      this.mapHeight / 2);
        this.foods = [];

        this.convertCoords = function(x, y)  {
          let camLeft = this.camX - this.canvas.width / 2 / this.viewScaleAnimated.value;
          let camTop = this.camY - this.canvas.height / 2 / this.viewScaleAnimated.value;
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
			}



      let game = new Game();



      //RENDER


      Game.prototype.render = function()  {
        let startTime = Date.now();


        this.canvas.clear();
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


        this.foods.filter(function(food)  {
          let playerRadius = this.player.diameter / 2 + this.borderWidth;
          let distance = Math.sqrt(
            Math.pow(Math.abs(food.x - this.player.x), 2) +
            Math.pow(Math.abs(food.y - this.player.y), 2));
          return distance < playerRadius;
        }.bind(this)).forEach(function(food)  {
          this.player.updateDiameter(Math.sqrt(Math.pow(this.player.diameter, 2) + food.kcal));
          this.foods.splice(this.foods.indexOf(food), 1);
        }.bind(this));


        //UPDATE PLAYER POSITION
        {

        let playerCanvasCoords = this.convertCoords(this.player.x, this.player.y);
        let mouseXoffset = this.mouseX - playerCanvasCoords[0];
        let mouseYoffset = this.mouseY - playerCanvasCoords[1];
        let preDistance = Math.sqrt(Math.pow(mouseXoffset, 2) + Math.pow(mouseYoffset, 2));
        let distance = preDistance < 100 ? 100 : preDistance;

        if (preDistance > 10)  {
          now = Date.now();
          playerXmove = (mouseXoffset / distance) * this.player.speed * (now - this.player.lastPosUpdate) / 15;
          playerYmove = (mouseYoffset / distance) * this.player.speed * (now - this.player.lastPosUpdate) / 15;

          if (Math.abs(playerXmove) < Math.abs(mouseXoffset / this.viewScaleAnimated.value))  {
            this.player.x += playerXmove;
          }  else  {
            this.player.x += mouseXoffset / this.viewScaleAnimated.value;
          }
          if (Math.abs(playerYmove) < Math.abs(mouseYoffset / this.viewScaleAnimated.value))  {
            this.player.y += playerYmove;
          }  else  {
            this.player.y += mouseYoffset / this.viewScaleAnimated.value;
          }
        }

        this.player.x = this.player.x < 0 ? 0 : this.player.x > this.mapWidth ? this.mapWidth : this.player.x;
        this.player.y = this.player.y < 0 ? 0 : this.player.y > this.mapHeight ? this.mapHeight : this.player.y;

        this.player.lastPosUpdate = Date.now();
        this.camX = this.player.x;
        this.camY = this.player.y;

        }
        //RENDER PLAYER
        {

        let canvasCoords = this.convertCoords(this.player.x, this.player.y);
        this.canvas.drawSlime(this.player.animatedDiameter.value, this.player.color, this.player.borderColor, canvasCoords[0], canvasCoords[1]);
        this.canvas.drawPlayerScore(this.player.score);

        }
        //UPDATE VIEW SCALE
        {

        let minSize = Math.min(this.canvas.width, this.canvas.height);
        let newViewScale = Math.min(  3 / Math.pow(this.player.diameter, 10/40),			minSize / this.player.diameter / 2  );
        this.viewScaleAnimated.animate(newViewScale - this.viewScale, 400);
        this.viewScale = newViewScale;

        }

        this.latestRenderTime = startTime;
        setTimeout(this.render.bind(this), 1000 / game.frameRate - (Date.now() - startTime));
      }

      //INITIALIZE GAME

      for(let i = 0; i < game.mapWidth*game.mapHeight/10000 * game.foodsPer100sqrpx * game.preFoodPart; i++)  {
        game.spawnFood();
      }
      game.canvas.resize();
      game.latestRenderTime = Date.now();
      game.render();








			game.canvas.el.addEventListener("mousemove", function(event) {
        game.mouseX = event.clientX;
        game.mouseY = event.clientY;
			});

			game.canvas.el.addEventListener("touchmove", function(event) {
				if (event.touches.length < 2)  {
					event.preventDefault();
        }
        game.mouseX = event.touches[0].clientX;
        game.mouseY = event.touches[0].clientY;
			});
			game.canvas.el.addEventListener("touchstart", function(event) {
        if (event.touches.length < 2)  {
					event.preventDefault();
        }
        game.mouseX = event.touches[0].clientX;
        game.mouseY = event.touches[0].clientY;
			});
			window.addEventListener("resize", function()  {
				game.canvas.resize();
			});
