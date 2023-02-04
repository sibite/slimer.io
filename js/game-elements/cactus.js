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