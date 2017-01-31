app.get('/calculator/:operation', function(request, response) {
  var num1 = request.query.num1;
  var num2 = request.query.num2;
  var mathOp = request.params.operation;
  var mathResult = 0;
  var mathObj = {
    "operator": mathOp,
    "firstOperand": num1,
    "secondOperand": num2,
    "solution": mathResult
  };
  
  if(mathOp === 'add') {
    mathResult = +num1 + +num2;
  }
  else if(mathOp === 'sub') {
    mathResult = +num1 - +num2;
  }
  else if(mathOp === 'mult') {
    mathResult = +num1 * +num2;
  }  
  else if(mathOp === 'div') {
    mathResult = +num1 / +num2;
  }
  else {
    mathResult = "Error 400";
  }
  
  response.end(`<h1> ${JSON.stringify(mathResult)}</h1>`);
});