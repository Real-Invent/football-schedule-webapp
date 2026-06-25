describe('Sports Calendar - Main Features', () => {
  it('should load and display events from events.json', () => {
    cy.get('[data-testid="event-card"]').should('have.length.greaterThan', 0);
  });

  it('should display event details correctly', () => {
    cy.get('[data-testid="event-card"]').first().then(($card) => {
      cy.wrap($card).should('contain.text', 'vs');
      cy.wrap($card).within(() => {
        cy.get('[data-testid="event-date"]').should('exist');
        cy.get('[data-testid="event-time"]').should('exist');
        cy.get('[data-testid="event-title"]').should('exist');
      });
    });
  });

  it('should allow filtering by league', () => {
    cy.get('[data-testid="league-filter-wc2026"]').click();
    cy.get('[data-testid="event-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', 'vs');
    });
  });

  it('should allow toggling favorites', () => {
    cy.get('[data-testid="event-card"]').first().within(() => {
      cy.get('[data-testid="favorite-btn"]').should('exist');
      cy.get('[data-testid="favorite-btn"]').click();
      cy.get('[data-testid="favorite-btn"]').should('have.class', 'active');
    });
  });

  it('should persist favorites in localStorage', () => {
    cy.get('[data-testid="event-card"]').first().within(() => {
      cy.get('[data-testid="favorite-btn"]').click();
    });

    cy.visit('/');
    cy.get('[data-testid="event-card"]').first().within(() => {
      cy.get('[data-testid="favorite-btn"]').should('have.class', 'active');
    });
  });

  it('should allow searching events by title', () => {
    cy.get('[data-testid="search-input"]').type('日本');
    cy.get('[data-testid="event-card"]').should('contain.text', '日本');
  });

  it('should display deep night times correctly (e.g., 26:00)', () => {
    cy.get('[data-testid="event-time"]').each(($time) => {
      const timeText = $time.text();
      const [hours] = timeText.split(':').map(Number);
      cy.wrap(hours).should('be.gte', 0).and('be.lte', 27);
    });
  });

  it('should be responsive on mobile viewport', () => {
    cy.viewport('iphone-x');
    cy.get('[data-testid="event-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="event-card"]').first().should('be.visible');
  });
});
