
class Variable{
	name = "";
	expr = null;
	value = 0;

	constructor(name, expr=null) {
		this.name = name;
		this.expr = expr;
	}

	/// Returns true if the graphics need update
	update(vars){
		if(this.expr){
			this.value = this.expr(vars);
			return true;
		}
		return false;
	}
}


class GradiatorLogic{
	variables = [];
	maxReflections = 10;
	answers = [];
	correctAnswer = -1;
	updateVariableCallback = () => {};
	constructor(updateVariableCallback){
		this.variables = [];
		if(updateVariableCallback)
			this.updateVariableCallback = updateVariableCallback;

		this.problems = [
			{
				variables: () => {
					this.variables.push(new Variable("x"));
					this.variables.push(new Variable("y", vars => vars[0]));
					this.variables.push(new Variable("z", vars => -vars[0]));
				},
				answers: ["y = x, z = -x", "y = z, z = x", "y = -x, z = x"],
				correctAnswer: 0
			},
			{
				variables: () => {
					this.variables.push(new Variable("x"));
					this.variables.push(new Variable("y", vars => 2 * vars[0]));
				},
				answers: ["x = y", "y = 2x", "x = 2y", "y = \\frac{x}{2}"],
				correctAnswer: 1
			},
			{
				variables: () => {
					this.variables.push(new Variable("x"));
					this.variables.push(new Variable("y", vars => vars[0] * vars[0] / 10));
				},
				answers: ["x = y", "y = x^2", "x = y^2", "y = x^{1/2}"],
				correctAnswer: 1
			},
			{
				variables: () => {
					this.variables.push(new Variable("theta"));
					this.variables.push(new Variable("x", vars => Math.cos(vars[0] / 3) * 10));
					this.variables.push(new Variable("y", vars => Math.sin(vars[0] / 3) * 10));
				},
				answers: [
					"\\theta = \\cos(y), \\theta = \\sin(x)",
					"y = \\theta, x = \\cos(y)",
					"x = \\cos(\\theta), y = \\sin(\\theta)",
					"y = \\tan(\\theta), x = \\arctan(\\theta)"
				],
				correctAnswer: 2
			},
			{
				variables: () => {
					this.variables.push(new Variable("x"));
					this.variables.push(new Variable("y"));
					this.variables.push(new Variable("z", vars => (vars[0] * vars[0] - vars[1] * vars[1]) / 10));
				},
				answers: [
					"x = z^2, y = z^2",
					"z = x^2 + y^2",
					"z = x^2 - y^2",
					"z = \\frac{1}{x^2 + y^2}"
				],
				correctAnswer: 2
			}
		]

		this.currentProblem = -1;

		this.nextProblem();
	}

	nextProblem(){
		if(this.currentProblem+1 < this.problems.length){
			this.variables.splice(0, this.variables.length);
			const problem = this.problems[++this.currentProblem];
			problem.variables();
			this.answers = problem.answers;
			this.correctAnswer = problem.correctAnswer;
		}
	}

	update(skipId=null, force=false){
		const vars = this.variables.map(v => v.value);
		for(let i = 0; i < this.variables.length; i++){
			if(i === skipId) continue;
			const variable = this.variables[i];
			if(force || variable.update(vars))
				this.updateVariableCallback(i, variable.value);
		}
	}

	updateVariable(varId, val){
		this.variables[varId].value = val;
		this.update(varId);
	}
}
