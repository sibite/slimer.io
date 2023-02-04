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