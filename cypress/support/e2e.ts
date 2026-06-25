// Cypress support file
beforeEach(() => {
  cy.clearLocalStorage();
  cy.visit('/');
});
