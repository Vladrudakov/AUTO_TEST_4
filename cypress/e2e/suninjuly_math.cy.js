describe('Task 1: Automation of SunInJuly Math Challenge', () => {
  const targetUrl = 'http://suninjuly.github.io/math.html';

  it('successfully reads x, calculates the math function, fills the form and submits the answer', () => {
    let alertMessage = '';
    cy.on('window:alert', (text) => {
      alertMessage = text;
    });

    cy.visit(targetUrl);
    cy.title().should('include', 'Robot power');

    cy.get('#input_value')
      .should('be.visible')
      .invoke('text')
      .then((xText) => {
        const x = parseFloat(xText.trim());
        expect(x).to.be.a('number').and.not.be.NaN;

        const answer = Math.log(Math.abs(12 * Math.sin(x))).toString();
        cy.log(`Received x = ${x}`);
        cy.log(`Calculated function value: ${answer}`);

        cy.get('#answer')
          .should('be.visible')
          .clear()
          .type(answer);

        cy.get('#robotCheckbox')
          .should('be.visible')
          .check()
          .should('be.checked');

        cy.get('#robotsRule')
          .should('be.visible')
          .check()
          .should('be.checked');

        cy.get('button[type="submit"]')
          .should('be.visible')
          .and('contain.text', 'Submit')
          .click();

        cy.then(() => {
          expect(alertMessage).to.match(/Congrats, you've passed the task!/);
        });
      });
  });

  it('validates the initial state of the form elements before interaction', () => {
    cy.visit(targetUrl);

    cy.get('#robotCheckbox').should('not.be.checked');
    cy.get('#peopleRule').should('be.checked');
    cy.get('#robotsRule').should('not.be.checked');
    cy.get('#answer').should('have.value', '');
  });
});
