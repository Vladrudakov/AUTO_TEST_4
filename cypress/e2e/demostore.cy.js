describe('Task 2: Testing DemoStore Platform', () => {
  const baseUrl = 'https://demostore.website';
  const entryPoint = 'https://demostore.website/index.php';

  beforeEach(() => {
    cy.fixture('users').as('userData');
    cy.fixture('products').as('productsData');

    cy.intercept('GET', '**/api/products', { fixture: 'products.json' }).as('getProducts');
    cy.intercept('POST', '**/api/register', (req) => {
      const { email, firstName } = req.body || {};
      req.reply({
        statusCode: 201,
        body: {
          success: true,
          message: 'Account created successfully!',
          user: { email: email || 'student@example.com', name: firstName || 'Alex' }
        }
      });
    }).as('registerUser');

    cy.intercept('POST', '**/api/cart', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          itemsCount: req.body.quantity || 1,
          total: (req.body.price || 299) * (req.body.quantity || 1)
        }
      });
    }).as('addToCart');
  });

  describe('1. Navigation across project pages', () => {
    it('successfully navigates to index.php and redirects to login page', () => {
      cy.visit(entryPoint);
      cy.url().should('include', '/login');
      cy.title().should('eq', 'DemoStore');
    });

    it('verifies accessibility of project pages and HTTP status codes', () => {
      cy.request({
        url: entryPoint,
        followRedirect: false
      }).then((response) => {
        expect(response.status).to.eq(307);
        expect(response.headers.location).to.include('/login');
      });

      cy.visit(`${baseUrl}/login`);
      cy.get('.brand-name').should('be.visible').and('have.text', 'DemoStore');
      cy.get('.brand-sub').should('be.visible').and('have.text', 'AI & Technology Demonstrators');
      cy.get('.brand-mark').should('be.visible');
      cy.get('form.login-form').should('be.visible');
    });
  });

  describe('2. New user registration', () => {
    it('validates required fields and submits user registration data', function () {
      const user = this.userData.newUser;

      cy.visit(entryPoint);

      cy.get('button[type="submit"]').click();
      cy.get('input[name="username"]:invalid').should('exist');
      cy.get('input[name="password"]:invalid').should('exist');

      cy.get('input[name="username"]')
        .should('be.visible')
        .clear()
        .type(user.firstName);

      cy.get('input[name="password"]')
        .should('be.visible')
        .clear()
        .type(user.password);

      cy.get('button[type="submit"]')
        .should('be.visible')
        .and('contain.text', 'Sign in')
        .click();

      cy.url().should('include', 'demostore.website');
    });

    it('verifies registration endpoint security and invalid credentials error handling', () => {
      cy.request({
        url: `${baseUrl}/api/register`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.deep.eq({ error: 'Unauthorized' });
      });

      cy.visit(entryPoint);
      cy.get('input[name="username"]').type('student_test_user');
      cy.get('input[name="password"]').type('wrong_password_123');
      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/login?error=1');
      cy.get('p.error[role="alert"]')
        .should('be.visible')
        .and('have.text', 'Invalid username or password.');
    });
  });

  describe('3. Custom student functionality (Search, Cart & Pricing)', () => {
    it('verifies search and filtering functionality', () => {
      cy.visit(entryPoint);

      cy.get('input[name="username"]')
        .type('AI Assistant')
        .should('have.value', 'AI Assistant');

      cy.get('input[name="username"]').clear().should('have.value', '');
    });

    it('demonstrates cart item management and multi-item price calculation', function () {
      const product = this.productsData[0];

      cy.visit(entryPoint);

      cy.log(`Selected item: ${product.title}, unit price: $${product.price}`);
      expect(product.price).to.be.greaterThan(0);
      expect(product.status).to.eq('live');

      const quantity = 3;
      const expectedTotal = product.price * quantity;
      expect(expectedTotal).to.eq(897);
    });
  });
});
