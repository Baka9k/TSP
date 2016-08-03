//---------------------- DOTS -------------------------

// Dots.js from https://github.com/Baka9k/dots with some changes:
// 1)Updated dots.buttons: added 'calculate' and 'random' buttons
// 2)Updated dots.handleButtonClick() (added new buttons support)
 

var dots = {};



//Data

dots.data = {
	dotsarray: [],
	linesarray: [],
};

dots.variables = {
	
	colors: {
		field: "#000000",
		line: "#00CED1",
		lineNumber: "#00CED1",
		dot: "#00FFFF",
		connectionLine: "#00FFFF",
		buttonStroke: "#00CED1",
		buttonText: "#00CED1",
		buttonBackground: "#000000",
	},
	
	dotRadius: 14,
	lineWidth: 0.1,
	connectionLineWidth: 3,
	font: '10px Arial',
	buttonFont: '20px Arial Black',
	canvas: "",
	context: "",
	width: 0,
	height: 0,
	
	tileWidth: 32,
	tileHeight: 32,
	
	tilesOnX: 0,
	tilesOnY: 0,
	
	dotsCounter: 0,
	linesCounter: 0,
	
	isMoving: false,
	dotIsMoving: false,
	connectionModeEnabled: false,
	connectingStarted: false,
	
};

dots.camera = {
	scale: 1,
	fromX: 0,
	fromY: 0,
	displacementX: 0,
	displacementY: 0,
	up: function() {
		this.fromY --;
	},
	down: function() {
		this.fromY ++;
	},
	left: function() {
		this.fromX --;
	},
	right: function() {
		this.fromX ++;
	},
};

dots.renderingTemporaryVariables = {
	tileWidth: 0,
	tileHeight: 0,
	firstVisibleTileX: 0,
	lastVisibleTileX: 0,
	firstVisibleTileY: 0,
	lastVisibleTileY: 0,
	absoluteDisplacementX: 0,
	absoluteDisplacementY: 0,
};

dots.buttons = {
	/*
	connectionMode: {
		name: "connectionMode",
		offsetRight: 50,
		offsetBottom: 50,
		width: 40,
		height: 40,
		text: "C",
		textOffsetX: 8,
		textOffsetY: 30,
		enabled: false,
	},
	*/
	calculate: {
		name: "calculate",
		offsetRight: 130,
		offsetBottom: 100,
		width: 120,
		height: 40,
		text: "Calculate",
		textOffsetX: 8,
		textOffsetY: 28,
		enabled: false,
	},
	random: {
		name: "random",
		offsetRight: 130,
		offsetBottom: 50,
		width: 120,
		height: 40,
		text: "Random",
		textOffsetX: 15,
		textOffsetY: 28,
		enabled: false,
	},
};



//Classes

var Dot = function(x, y, id, color) {
	this.x = x;
	this.y = y;
	this.id = id;
	this.color = color || dots.variables.colors.dot;
	return this;
};

var Line = function(startDot, endDot, color) {
	this.startDot = startDot;
	this.endDot = endDot;
	this.color = color || dots.variables.colors.connectionLine;
	return this;
};



//Methods

dots.init = function() {
	
	dots.prepareCanvas();
	dots.activateEventListeners();
	dots.calculateVariables();
	
	dots.draw();
	
};


dots.calculateVariables = function() {
	
	var vars = dots.variables;
	
	vars.tilesOnX = Math.ceil(vars.width / vars.tileWidth);
	vars.tilesOnY = Math.ceil(vars.height / vars.tileHeight);
	
};


dots.prepareCanvas = function() {
	
	var canvas = document.getElementById('canvas0');
	var context = canvas.getContext("2d");
	var width = window.innerWidth;
	var height = window.innerHeight;

	canvas.width = width;
	canvas.height = height;
	canvas.style.position = "absolute";
	canvas.style.left = "0px";
	canvas.style.top = "0px";

	dots.variables.canvas = canvas;
	dots.variables.context = context;
	dots.variables.width = width;
	dots.variables.height = height;
    
};


dots.activateEventListeners = function() {
	
	var canvas = dots.variables.canvas;
	var handleMouse = dots.handleMouseEvent;
	
	document.addEventListener('keydown', dots.handleKeyDown, false);
	canvas.onmousedown = handleMouse.startMoving;
	canvas.onmousemove = handleMouse.move;
	canvas.onmouseup = handleMouse.stopMoving;
	canvas.onmouseout = handleMouse.mouseout;
    
};


dots.handleKeyDown = function(event) {
	
	var keyCode = event.keyCode;
	
	switch(keyCode) {
		case 38:
			dots.camera.up();
			break;
		case 40:
			dots.camera.down();
			break;
		case 37:
			dots.camera.left();
			break;
		case 39:
			dots.camera.right();
			break;
		case 67:
			dots.variables.connectionModeEnabled = !dots.variables.connectionModeEnabled;
			break;
		default:
			return;
	}
	
	//←    37
	//↑    38
	//→    39
	//↓    40
	//c C  67
	
	dots.draw();
	
};


dots.handleMouseEvent = {
	
	variables: {
		movingStartX: 0,
		movingStartY: 0,
		currentX: 0,
		currentY: 0,
		lineStartX: 0,
		lineStartY: 0,
		lineEndX: 0,
		lineEndY: 0,
		startDot: "",
		endDot: "",
		movingDot: "",
		buttonClicked: false,
	},
	
	
	startMoving: function(e) {
		
		var pointerX = e.pageX;
		var pointerY = e.pageY;
		
		var vars = dots.variables;
		var tvars = dots.renderingTemporaryVariables;
		var lvars = dots.handleMouseEvent.variables;
		var dotsarray = dots.data.dotsarray;
		
		//if button clicked
		var button = dots.checkIfPointerOnButton(pointerX, pointerY);
		if (button) {
			dots.handleButtonClick(button);
			lvars.buttonClicked = true;
			return;	
		}
		
		lvars.movingStartX = pointerX;
		lvars.movingStartY = pointerY;
		lvars.currentX = pointerX;
	    lvars.currentY = pointerY;
		
		if (vars.connectionModeEnabled) {
			//start line
			
			if (dotsarray[1] == undefined) return;
			
			var dot = dots.checkIfPointerOnDot(pointerX, pointerY);
			if (dot) {
				lvars.lineStartX = dot.x - tvars.absoluteDisplacementX;
				lvars.lineStartY = dot.y - tvars.absoluteDisplacementY;
				vars.connectingStarted = true;
				lvars.startDot = dot.id;
			}
			 
		} else {
			
			//if pointer on dot
			var dot = dots.checkIfPointerOnDot(pointerX, pointerY);
			if (dot) {
				vars.dotIsMoving = true;
				lvars.movingDot = dot.id;
			}
			
			//if pointer not on dot
			if (!vars.dotIsMoving) {
				vars.isMoving = true;
			}
			
		}
	
	},
	
	
	move: function(e) {
		
		var vars = dots.variables;
		var lvars = dots.handleMouseEvent.variables;
		var dotsarray = dots.data.dotsarray;
		
		if (lvars.buttonClicked) return;
		
		var pointerX = e.pageX;
		var pointerY = e.pageY;
		var displacementX = pointerX - lvars.currentX;
		var displacementY = pointerY - lvars.currentY;
			
		if (vars.isMoving) {
			
			dots.camera.displacementX += displacementX;
			dots.camera.displacementY += displacementY;
			
			dots.draw();
			
		}
		
		else if (vars.dotIsMoving) {
			
			dotsarray[lvars.movingDot].x += displacementX;
			dotsarray[lvars.movingDot].y += displacementY;
			
			dots.draw();
			
	    }
	    
		else if (vars.connectingStarted) {
			
			dots.draw();
		   	
		   	var context = vars.context;
		   	var lineWidth = vars.connectionLineWidth;
		   	var lineColor = vars.colors.connectionLine;
		   	var lineStartX = lvars.lineStartX;
		   	var lineStartY = lvars.lineStartY;
		   	var lineEndX = pointerX;
		   	var lineEndY = pointerY;
		   	
			vars.context.lineWidth = lineWidth;
			vars.context.strokeStyle = lineColor;
			vars.context.beginPath();
			context.moveTo(lineStartX, lineStartY);
			context.lineTo(lineEndX, lineEndY);
			context.stroke();
			context.closePath();
			
	    }
	    
	    lvars.currentX = pointerX;
	    lvars.currentY = pointerY;
	    
    },
    
    
	stopMoving: function(e) {
		
		var vars = dots.variables;
		var lvars = dots.handleMouseEvent.variables;
		var tvars = dots.renderingTemporaryVariables;
		
		var pointerX = e.pageX;
		var pointerY = e.pageY;
		var displacementX = pointerX - lvars.movingStartX;
		var displacementY = pointerY - lvars.movingStartY;
		
		if (lvars.buttonClicked) {
			lvars.buttonClicked = false;
			return;
		}
		
		if (vars.isMoving) {
		
            vars.isMoving = false;
            
            //If it was click - add new dot
		    if ((displacementX == 0) && (displacementY == 0)) {
		    	var x = pointerX + tvars.absoluteDisplacementX;
		    	var y = pointerY + tvars.absoluteDisplacementY;
		        dots.addDot(x, y);	
		    }
		    
		}
		
		else if (vars.dotIsMoving) {
			vars.dotIsMoving = false;
		}
		
		else if (vars.connectingStarted) {
			
			vars.connectingStarted = false;
			
			//if pointer on dot
			var dot = dots.checkIfPointerOnDot(pointerX, pointerY);
			if (dot) {
				lvars.endDot = dot.id;
				dots.addLine(lvars.startDot, lvars.endDot);
			}
			
	    }
	    
	    dots.draw();
	    
    },
    
    
	mouseout: function(e) {
		
		var vars = dots.variables;
		var lvars = dots.handleMouseEvent.variables;
		
		if (vars.isMoving) {
            vars.isMoving = false;    
		}
		else if (vars.dotIsMoving) {
			vars.dotIsMoving = false;
		}
		else if (vars.connectionStarted) {
			vars.connectionStarted = false;
	    }
	    
	    dots.draw();
		
    },
    
    
};


dots.handleButtonClick = function(button) {
	
	var vars = dots.variables;
	var buttons = dots.buttons;
	
	switch(button.name) {
		case "connectionMode":
			dots.variables.connectionModeEnabled = !dots.variables.connectionModeEnabled;
			buttons.connectionMode.enabled = !buttons.connectionMode.enabled;
			break;
		case "random":
			tsp.random();
			break;
		case "connectionMode":
			tsp.calculate();
			break;
		default:
			console.log("dots.handleButtonClick() received unknown type of button!");
			return;
	}
	
	dots.draw();
	
};


dots.checkIfPointerOnButton = function (x, y) {

	var buttons = dots.buttons;
	
	for (var btn in buttons) {
	
		var button = buttons[btn];
		var buttonStartX = dots.variables.width - button.offsetRight;
		var buttonEndX = buttonStartX + button.width;
		var buttonStartY = dots.variables.height - button.offsetBottom;
		var buttonEndY = buttonStartY + button.height;
		
		if ( (x > buttonStartX) && (y > buttonStartY) && (x < buttonEndX) && (y < buttonEndY) ) {
			return button;
		}
		
	}
	
	return false;
	
};


dots.checkIfPointerOnDot = function (x, y) {
	
	var vars = dots.variables;
	var tvars = dots.renderingTemporaryVariables;
	var dotsarray = dots.data.dotsarray;
	
	for (var i = 0; i < dotsarray.length; i++) {
	
		var dot = dotsarray[i];
		var dotRightmostPoint = dot.x - tvars.absoluteDisplacementX + vars.dotRadius;
		var dotLeftmostPoint = dot.x - tvars.absoluteDisplacementX - vars.dotRadius;
		var dotHighestPoint = dot.y - tvars.absoluteDisplacementY - vars.dotRadius;
		var dotLowestPoint = dot.y - tvars.absoluteDisplacementY + vars.dotRadius;
		
		if ( (x > dotLeftmostPoint) && (y > dotHighestPoint) && (x < dotRightmostPoint) && (y < dotLowestPoint) ) {
			return dot;
		}
		
	}
	
	return false;
	
};


dots.addDot = function (x, y) {
	
	var dotsarray = dots.data.dotsarray;
	
	var dot = new Dot(x, y, dotsarray.length);
	dotsarray.push(dot);
	
};


dots.addLine = function (startDot, endDot) {

	var linesarray = dots.data.linesarray;
	
	var line = new Line(startDot, endDot);
	linesarray.push(line);
	
};


dots.updateRenderingTemporaryVariables = function() {
	
	var vars = dots.variables;
	var tempVars = dots.renderingTemporaryVariables;
	var camera = dots.camera;
	var fromXYUpdated = false;
	
	while (!fromXYUpdated) {
		if (camera.displacementX > tempVars.tileWidth) {
			camera.displacementX -= tempVars.tileWidth;
			camera.fromX --;
			continue;
		}
		if (camera.displacementY > tempVars.tileHeight) {
			camera.displacementY -= tempVars.tileHeight;
			camera.fromY --;
			continue;
		}
		if (camera.displacementX < -tempVars.tileWidth) {
			camera.displacementX += tempVars.tileWidth;
			camera.fromX ++;
			continue;
		}
		if (camera.displacementY < -tempVars.tileHeight) {
			camera.displacementY += tempVars.tileHeight;
			camera.fromY ++;
			continue;
		}
		fromXYUpdated = true;
	}
	
	tempVars.tileWidth = vars.tileWidth * camera.scale;
	tempVars.tileHeight = vars.tileHeight * camera.scale;
	
	tempVars.firstVisibleTileX = camera.fromX;
	tempVars.firstVisibleTileY = camera.fromY;
	tempVars.lastVisibleTileX = tempVars.firstVisibleTileX + vars.tilesOnX;
	tempVars.lastVisibleTileY = tempVars.firstVisibleTileY + vars.tilesOnY;
	
	tempVars.absoluteDisplacementX = camera.fromX * tempVars.tileWidth - camera.displacementX;
	tempVars.absoluteDisplacementY = camera.fromY * tempVars.tileWidth - camera.displacementY;
	
};


dots.lineIsVisible = function(line) {
	if ( dots.dotIsVisible(line.startDot) || dots.dotIsVisible(line.endDot) ) return true;
	return false;
};


dots.dotIsVisible = function(dot) {
	
	var vars = dots.variables;
	var tvars = dots.renderingTemporaryVariables;
	var dotRightmostPoint = dot.x + vars.dotRadius;
	var dotLeftmostPoint = dot.x - vars.dotRadius;
	var dotHighestPoint = dot.y - vars.dotRadius;
	var dotLowestPoint = dot.y + vars.dotRadius;
	
	if ( (dotRightmostPoint < tvars.absoluteDisplacementX) || (dotLeftmostPoint > tvars.absoluteDisplacementX + vars.width) ) {
		return false;
	}
	if ( (dotLowestPoint < tvars.absoluteDisplacementY) || (dotHighestPoint > tvars.absoluteDisplacementY + vars.height) ) {
		return false;
	}
	
	return true;
	
};


dots.getDotById = function(id) {
	
	var dotsarray = dots.data.dotsarray;
	
	for (var i = 0; i < dotsarray.length; i++) {
		var dot = dotsarray[i];
		if (dot.id == id) {
			return dot;
		}
	}
	return false;
	
};


//Drawing

dots.draw = function() {
	
	dots.updateRenderingTemporaryVariables();
	
	dots.drawField();
	dots.drawGrid();
	dots.drawLines();
	dots.drawDots();
	dots.drawTools();
	
	tsp.draw();
	
};


dots.drawField = function() {
	
	var context = dots.variables.context;
	var fieldColor = dots.variables.colors.field;
	var width = dots.variables.width;
	var height = dots.variables.height;
	
	context.fillStyle = fieldColor;
	context.fillRect(0, 0, width, height);
	
};


dots.drawLine = function (orientation, where, from, to, text) {
	
	var vars = dots.variables;
	var lineWidth = vars.lineWidth;
	var lineColor = vars.colors.line;
	var textColor = vars.colors.lineNumber;
	var font = vars.font;
	var context = vars.context;
	
	context.strokeStyle = lineColor;
	context.fillStyle = textColor;
	context.font = font;
	context.lineWidth = lineWidth;
	
	if (orientation == "horizontal") {
		
		context.beginPath();
		context.moveTo(from, where);
		context.lineTo(to, where);
		context.stroke();
		
		context.fillText(text, from + 4, where + 12);
		
	} else if (orientation == "vertical") {
		
		context.beginPath();
		context.moveTo(where, from);
		context.lineTo(where, to);
		context.stroke();
		
		context.fillText(text, where + 4, from + 12);
		
	}
	
};


dots.drawGrid = function() {
	
	var vars = dots.variables;
	var tempVars = dots.renderingTemporaryVariables;
	var camera = dots.camera;
	
	for (var i = 0; i < vars.tilesOnY; i++) {
		dots.drawLine("horizontal", i * tempVars.tileHeight + camera.displacementY, 0, vars.width, i + camera.fromY);
	}
	for (var i = 0; i < vars.tilesOnX; i++) {
		dots.drawLine("vertical", i * tempVars.tileWidth + camera.displacementX, 0, vars.height, i + camera.fromX);
	}
	
};


dots.drawTools = function() {
	
	var buttons = dots.buttons;
	var vars = dots.variables;
	
	for (var btn in buttons) {
		
		var button = buttons[btn];
		var x = vars.width - button.offsetRight;
		var y = vars.height - button.offsetBottom;
		var width = button.width;
		var height = button.height;
		var context = vars.context;
		var font = vars.buttonFont;
		var text = button.text;
		var textOffsetX = button.textOffsetX;
		var textOffsetY = button.textOffsetY;
		
		//button background and stroke
		context.fillStyle = vars.colors.buttonBackground;
		context.fillRect(x, y, width, height);
		context.strokeStyle = vars.colors.buttonStroke;
		context.lineWidth = 2;
		context.strokeRect(x, y, width, height);
		
		//button text shadow
		context.font = font;
		context.shadowColor = vars.colors.buttonText;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur = 5;
		context.strokeStyle = vars.colors.buttonText;
		context.lineWidth = 2;
		context.strokeText(text, x + textOffsetX, y + textOffsetY);
		context.shadowBlur = 0;
		
		//button text
		if (button.enabled) {
			context.fillStyle = vars.colors.buttonText;
		} else {
			context.fillStyle = vars.colors.buttonBackground;
		}
		context.fillText(text, x + textOffsetX, y + textOffsetY);
		
	}
	
};


dots.drawDot = function(x, y, radius, color) {
	
	var context = dots.variables.context;
	
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	context.closePath();
	context.fillStyle = color;
	context.fill();
	
};


dots.drawConnectionLine = function(startX, startY, endX, endY, color) {
	
	var vars = dots.variables;
	var context = vars.context;
	
	context.lineWidth = vars.connectionLineWidth;
	context.beginPath();
	context.moveTo(startX, startY);
	context.lineTo(endX, endY);
	context.closePath();
	context.strokeStyle = color;
	context.stroke();
	
};


dots.drawDots = function() {
	
	var dotsarray = dots.data.dotsarray;
	var vars = dots.variables;
	var tvars = dots.renderingTemporaryVariables;
	var radius = vars.dotRadius;
	
	for (var i = 0; i < dotsarray.length; i++) {
		var dot = dotsarray[i];
		if (dots.dotIsVisible(dot)) {
			var x = dot.x - tvars.absoluteDisplacementX;
			var y = dot.y - tvars.absoluteDisplacementY;
			dots.drawDot(x, y, radius, dot.color);
		}
	}
	
};


dots.drawLines = function() {
	
	var dotsarray = dots.data.dotsarray;
	var linesarray = dots.data.linesarray;
	var vars = dots.variables;
	var tvars = dots.renderingTemporaryVariables;
	
	for (var i = 0; i < linesarray.length; i++) {
		var line = linesarray[i];
		var startDot = dots.getDotById(line.startDot);
		var endDot = dots.getDotById(line.endDot);
		var startX = startDot.x - tvars.absoluteDisplacementX;
		var startY = startDot.y - tvars.absoluteDisplacementY;
		var endX = endDot.x - tvars.absoluteDisplacementX;
		var endY = endDot.y - tvars.absoluteDisplacementY;
		if (dots.lineIsVisible(line)) {
			dots.drawConnectionLine(startX, startY, endX, endY, line.color);
		}
	}
	
};




//------------------------------ TSP --------------------------------


var tsp = {};


tsp.variables = {
	//How many dots adds tsp.random()
	randomDots: 5,
	colors: {
		possibleRoute: "#00CED1",
		route: "#7FFF00",
	},
	calculated: false,
	shortestRoute: "",
};


tsp.random = function () {
	//Adds some randomly placed dots in dotsarray
	
	var tvars = dots.renderingTemporaryVariables;
	
	var minX = 0;
	var maxX = dots.variables.width;
	var minY = 0;
	var maxY = dots.variables.height;
	
	for (var i = 0; i < tsp.variables.randomDots; i++) {
		var x = tsp.getRandomInt(minX, maxX) + tvars.absoluteDisplacementX;
		var y = tsp.getRandomInt(minY, maxY) + tvars.absoluteDisplacementY;
		dots.addDot(x, y);
	}
	
	dots.draw();
	
};


tsp.distanceBetween = function(dot1,dot2) {
	var x1 = dot1.x;
	var y1 = dot1.y;
	var x2 = dot2.x;
	var y2 = dot2.y;
	var distance = Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
	return distance;
}


tsp.inArray = function(array, value) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] == value) {
			return true;
		}
	}
	return false;
}


tsp.carefulSplice = function(array, index) {
	//returns spliced array without modifying original array
	var splicedArray = new Array();
	for (var i = 0; i < index; i++) {
		splicedArray[i] = array[i];
	}
	for (var i = index; i < array.length - 1; i++) {
		splicedArray[i] = array[i+1];
	}
	return splicedArray;
};


tsp.getIndexOfMin = function(array) {
    if (array.length === 0) {
        return -1;
    }
    var max = array[0];
    var maxIndex = 0;
    for (var i = 1; i < array.length; i++) {
        if (array[i] > max) {
            maxIndex = i;
            max = array[i];
        }
    }
    return maxIndex;
};


tsp.getPermutations = function(array) {
	//Returns array of arrays with all possible permutations of input array elements
	if (array.length == 1) {
		return [array];
	}
	var allPermutations = new Array();
	for (var i = 0; i < array.length; i++) {
		var permutation = tsp.getPermutations(tsp.carefulSplice(array, i));
		for (var j = 0; j < permutation.length; j++) {
			permutation[j].unshift(array[i]);
			allPermutations.push(permutation[j]);
		}
	}  
	return allPermutations;
};


tsp.brute = function() {
	
	var dotsarray = dots.data.dotsarray;
	
	var routes = tsp.getPermutations(dotsarray);
	var distances = new Array(routes.length);
	
	for (var i = 0; i < routes.length; i++) {
		var route = routes[i];
		//Return salesman to the origin city:
		route.push(route[0]);
		var distance = 0;
		for (var j = 1; j < route.length; j++) {
			distance += tsp.distanceBetween(route[j], route[j-1]);
		}
		distances[i] = distance;
	}
	var shortestRouteNumber = tsp.getIndexOfMin(distances);
	var shortestRoute = routes[shortestRouteNumber];
	
	return shortestRoute;
	
};


tsp.drawAllPossibleRoutes = function() {
	
	var dotsarray = dots.data.dotsarray;
	
	var halflength = Math.ceil(dotsarray.length / 2);
	for (var i = 0; i < halflength; i++) {
		for (var j = 0; j < dotsarray.length; j++) {
			if (i == j) continue;
			var startDot = dotsarray[i];
			var endDot = dotsarray[j];
			var color = tsp.variables.colors.possibleRoute;
			dots.drawConnectionLine(startDot.x, startDot.y, endDot.x, endDot.y, color);
		}
	}
	
};


tsp.drawShortestRoute = function() {
	
	var route = tsp.variables.shortestRoute;
	
	for (var i = 1; i < route.length; i++) {
		var startDot = route[i-1];
		var endDot = route[i];
		var color = tsp.variables.colors.route;
		dots.drawConnectionLine(startDot.x, startDot.y, endDot.x, endDot.y, color);	
	}
	
};


tsp.draw = function() {

	if (!tsp.variables.calculated) return;
	
	tsp.drawAllPossibleRoutes();
	tsp.drawShortestRoute(shortestRoute);
	
};


tsp.calculate = function() {
	
	if (tsp.variables.calculated) return;
	if (dots.data.dotsarray.length < 2) return;
	
	var shortestRoute = tsp.brute();
	tsp.variables.shortestRoute = shortestRoute;
	
	tsp.variables.calculated = true;
	
	dots.draw();
	
};

tsp.getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


//-------------------------------------------------------------------

window.onload = function() {
	dots.init();
};





