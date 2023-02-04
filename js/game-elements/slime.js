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
