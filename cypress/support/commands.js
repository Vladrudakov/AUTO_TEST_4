Cypress.Commands.add('calculateMathFunction', (x) => {
  const num = parseFloat(x);
  return Math.log(Math.abs(12 * Math.sin(num)));
});
