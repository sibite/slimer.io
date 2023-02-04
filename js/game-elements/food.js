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
