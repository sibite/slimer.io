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