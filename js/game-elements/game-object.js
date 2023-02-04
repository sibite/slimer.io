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
