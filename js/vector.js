let Vector = function(x, y)	{
	Object.defineProperties(this, {
		x:	{
			get: function()	{
				return this._x;
			},
			set: function(value) {
				this._x = value;
				this.calc();
			}
		},
		y:	{
			get: function()	{
				return this._y;
			},
			set: function(value) {
				this._y = value;
				this.calc();
			}
		},
		length:	{
			get: function()	{
				return this._length;
			},
			set: function(value)	{
				if (this._length != 0)	{
					this._x *= value/this._length;
					this._y *= value/this._length;
				} else {
					this._x = this._y = value;
				}
				this._length = Math.abs(value);
			}
		},
		angle: {
			get: function() {
				return this._angle;
			},
			set: function(value)	{
				this._x = Math.cos(value) * this._length;
				this._y = -Math.sin(value) * this._length;
				this.calc();
			}
		}
	});
	this.x = x;
	this.y = y;
}

Vector.fromAngle = function(angle, length = 1)	{
	let vector = new Vector(length, 0);
	vector.angle = angle;
	return vector;
}
Vector.prototype.calc = function() {
	this._length = Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2));
	let angle = Math.atan2(-this.y, this.x);
	this._angle = angle >= 0 ? angle : 2*Math.PI + angle;
}
Vector.prototype.add = function() {
	if (arguments.length == 1)	{
		var vector = arguments[0];
		this._x += vector.x;
		this._y += vector.y;
		this.calc();
	}	else {
		this._x += arguments[0];
		this._y += arguments[1];
		this.calc();
	}
	return this;
}
Vector.prototype.subtract = function() {
	if (arguments.length == 1)	{
		var vector = arguments[0];
		this._x -= vector.x;
		this._y -= vector.y;
		this.calc();
	}	else {
		this._x -= arguments[0];
		this._y -= arguments[1];
		this.calc();
	}
	return this;
}
Vector.prototype.toLength = function(length) {
	let vector = this.copy();
	vector.length = length;
	return vector;
}
Vector.prototype.setLength = function(length) {
	this.length = length;
	return this;
}
Vector.prototype.toFactor = function() {
	this.length = 1;
	return this;
}
Vector.prototype.copy = function() {
	return new Vector(this.x, this.y);
}
