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