'use strict';
let canvas;
let width;
let height;

let game;

let mouseCenter = [0,0];
let lastMouseCenter = [0,0];
let mouseDragging = null; // Stores the SVG element being dragged

let variableElems = [];

const barHeight = 100;
const barWidth = 10;
const barStride = 100;
const handleWidth = 50;
const handleHeight = 20;
const majorTickLength = 10;
const minorTickLength = 5;

function clampValue(y, min=-1, max=1){
	return Math.max(Math.min(y, max), min);
}

function updateVariableElem(id, value){
	const varPos = variablePosition(id);
	const elem = variableElems[id];
	const v = game.variables[id];
	elem.setAttribute("y", clampValue(value * v.scale) * barHeight / 2 + varPos[1] - handleHeight/2);
}

function variablePosition(i){
	return [i * barStride + 100, 150];
}


window.onload = function() {
	canvas = document.getElementById("scratch");
	if(!canvas) return false;
	var rect = canvas.getBoundingClientRect();
	// IE8 doesn't support Rect.width nor height (nor even canvas)
	width = rect.right - rect.left;
	height = rect.bottom - rect.top;
	game = new GradiatorLogic(updateVariableElem);

	// It's tricky to obtain client coordinates of a HTML element.
	function getOffsetRect(elem){
		const box = elem.getBoundingClientRect();
		const body = document.body;
		const docElem = document.documentElement;

		const clientTop = docElem.clientTop || body.clientTop || 0
		const clientLeft = docElem.clientLeft || body.clientLeft || 0

		const top  = box.top - clientTop
		const left = box.left - clientLeft

		return { top: Math.round(top), left: Math.round(left) }
	}

	canvas.onmousemove = function (e){

		// For older InternetExplorerS
		if (!e)	e = window.event;

		const r = getOffsetRect(canvas);

		mouseCenter[0] = e.clientX - r.left;
		mouseCenter[1] = e.clientY - r.top;

		if(mouseDragging && (mouseCenter[0] !== lastMouseCenter[0] || mouseCenter[1] !== lastMouseCenter[1])){
			lastMouseCenter[0] = mouseCenter[0];
			lastMouseCenter[1] = mouseCenter[1];
			const v = game.variables[mouseDragging.varId];
			const varPos = variablePosition(0);
			const y = (mouseCenter[1] - varPos[1]) / (barHeight / 2);
			const clampedY = clampValue(y) * v.scale;
			console.log(`clampedY: ${clampedY}`);
			mouseDragging.setAttribute("y", clampedY / v.scale * barHeight / 2 + varPos[1] - handleHeight/2);
			game.updateVariable(mouseDragging.varId, clampedY);
		}
		e.preventDefault();
	};

	canvas.onmousedown = function(evt){
		if (!evt.target.classList.contains('draggable')) return;
		mouseDragging = evt.target;

		const r = getOffsetRect(canvas);

		lastMouseCenter[0] = evt.clientX - r.left;
		lastMouseCenter[1] = evt.clientY - r.top;
	};

	canvas.onmouseup = function(e){
		mouseDragging = null;
	};

	var stageno = document.getElementById('stageno');
	if(stageno){
		for(let i = 0; i < game.problems.length; i++){
			const cell = document.createElement('span');
			cell.id = "stageno" + (i+1);
			cell.innerHTML = (i+1);
			cell.className = "noselect " + (i === game.currentProblem ? "probcell currentProb" : "probcell");
			cell.onclick = evt => nextStage(parseInt(evt.target.innerHTML)-1);
			stageno.appendChild(cell);
		}
	}

	const resultElem = document.getElementById("result");

	const answerButton = document.getElementById('answerButton');
	answerButton.addEventListener("click", () => {
		if(document.getElementById(`answer${game.correctAnswer}`).checked){
			resultElem.innerHTML = "Correct answer!";
			resultElem.classList = "result correct";
			nextButton.style.display = "block";
			return;
		}
		resultElem.innerHTML = "Incorrect answer!";
		resultElem.classList = "result incorrect";
		nextButton.style.display = "none";
	});

	const nextButton = document.getElementById("nextButton");
	nextButton.addEventListener("click", () => {
		nextStage();
	})

	nextStage(0);
};

function nextStage(stageno){
	if(stageno !== undefined)
		game.currentProblem = stageno - 1;
	game.nextProblem();
	var nextStageElem = document.getElementById("nextstage");
	nextStageElem.style.display = "none";
	for(var i = 0; i < game.problems.length; i++){
		var stageNoElem = document.getElementById("stageno" + (i + 1));
		stageNoElem.className = "noselect " + (i === game.currentProblem ? "probcell currentProb" : "probcell");
	}
	const problemStatementElem = document.getElementById("problemStatement");
	while(problemStatementElem.firstChild) problemStatementElem.removeChild(problemStatementElem.firstChild);
	for(let i = 0; i < game.answers.length; i++){
		const answerDivElem = document.createElement("div");
		const answerRadioElem = document.createElement("input");
		answerRadioElem.setAttribute("type", "radio");
		answerRadioElem.setAttribute("name", "answer");
		answerRadioElem.setAttribute("value", i);
		answerRadioElem.id = `answer${i}`;
		answerDivElem.appendChild(answerRadioElem);
		const answerTextElem = document.createElement("label");
		answerTextElem.setAttribute("for", answerRadioElem.id);
		answerDivElem.appendChild(answerTextElem);
		katex.render("\\displaystyle " + game.answers[i], answerTextElem);
		problemStatementElem.append(answerDivElem);
	}
	const resultElem = document.getElementById("result");
	resultElem.innerHTML = "";
	const nextButton = document.getElementById("nextButton");
	nextButton.style.display = "none";
	draw();
}

function draw() {
	while(canvas.firstChild) canvas.removeChild(canvas.firstChild);
	variableElems.splice(0, variableElems.length);

	function rect(x, y, width, height, color="blue"){
		const elem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		elem.setAttribute("x", x);
		elem.setAttribute("y", y);
		elem.setAttribute("width", width);
		elem.setAttribute("height", height);
		elem.setAttribute("fill", color);
		elem.setAttribute("stroke", "black");
		canvas.appendChild(elem);
		return elem;
	}

	for(let i = 0; i < game.variables.length; i++){
		const v = game.variables[i];

		const [x, y] = variablePosition(i);
		rect(-barWidth/2 + x, -barHeight/2 + y, barWidth, barHeight, "#005f7f");
		for(let j = -2; j <= 2; j++) {
			const tickElem = document.createElementNS("http://www.w3.org/2000/svg", "line");
			const y2 = y + j * barHeight / 4;
			tickElem.setAttribute("x1", x - barWidth / 2);
			tickElem.setAttribute("y1", y2);
			tickElem.setAttribute("x2", x - barWidth / 2 - (j % 2 === 0 ? majorTickLength : minorTickLength));
			tickElem.setAttribute("y2", y2);
			tickElem.setAttribute("stroke", "black");
			canvas.appendChild(tickElem);
			if(j % 2 === 0){
				const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
				tickLabel.innerHTML = j * v.scale / 2;
				tickLabel.setAttribute("x", x - barWidth / 2 - majorTickLength - 25);
				tickLabel.setAttribute("y", y2 + 5);
				tickLabel.classList = "tickText";
				canvas.appendChild(tickLabel);
			}
		}
		const thumb = rect(-handleWidth/2 + x, -barHeight/2 + -handleHeight/2 + y, handleWidth, handleHeight, "#7f5f5f");
		thumb.classList = "draggable";
		thumb.varId = i;
		variableElems.push(thumb);
		const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
		label.innerHTML = v.name;
		label.setAttribute("x", x);
		label.setAttribute("y", y - barHeight / 2 - 20);
		label.classList = "labelText";
		canvas.appendChild(label);
	}

	game.update(null, true);
}
