describe('Sports Calendar - Fallback & Error Handling', () => {
  it('should fallback to SAMPLE_EVENTS when events.json is not available', () => {
    // Intercept and block events.json request
    cy.intercept('GET', '/data/events.json', { statusCode: 404 }).as('eventsNotFound');
    cy.visit('/');
    cy.wait('@eventsNotFound');

    // Should still display events from fallback
    cy.get('[data-testid="event-card"]').should('have.length.greaterThan', 0);
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('GET', '/data/events.json', { forceNetworkError: true }).as('networkError');
    cy.visit('/');
    cy.wait('@networkError');

    // Should still display events
    cy.get('[data-testid="event-card"]').should('have.length.greaterThan', 0);
  });

  it('should display events with broadcaster information', () => {
    cy.get('[data-testid="event-card"]').first().within(() => {
      cy.get('[data-testid="broadcaster"]').should('have.length.greaterThan', 0);
    });
  });
});
