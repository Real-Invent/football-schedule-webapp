describe('Sports Calendar - Main Features', () => {
  it('should load and display events from events.json', () => {
    cy.get('[data-testid="event-card"]').should('have.length.greaterThan', 0);
  });

  it('should display event details correctly', () => {
    cy.get('[data-testid="event-card"]').first().then(($card) => {
      cy.wrap($card).should('be.visible');
      cy.wrap($card).should('contain', ':');
    });
  });

  it('should allow filtering by league', () => {
    cy.get('[data-testid="event-card"]').then(($cards) => {
      const initialCount = $cards.length;
      cy.get('button').contains('FIFA W杯').click();
      cy.get('[data-testid="event-card"]').should('have.length.lessThan', initialCount);
    });
  });

  it('should allow toggling favorites', () => {
    cy.get('[data-testid="event-card"]').first().within(() => {
      cy.get('button[aria-label="お気に入り"]').should('exist');
      cy.get('button[aria-label="お気に入り"]').click();
    });
  });

  it('should persist favorites in localStorage', () => {
    cy.get('[data-testid="event-card"]').first().then(($card) => {
      const cardText = $card.text();
      cy.wrap($card).find('button[aria-label="お気に入り"]').click();
      cy.window().then((win) => {
        const favorites = JSON.parse(win.localStorage.getItem('favorites') || '[]');
        expect(favorites.length).to.be.greaterThan(0);
      });
    });
  });

  it('should allow searching events by title', () => {
    cy.get('input[placeholder*="検索"]').type('日本');
    cy.get('[data-testid="event-card"]').each(($card) => {
      cy.wrap($card).should('contain.text', '日本');
    });
  });

  it('should display deep night times correctly (e.g., 26:00)', () => {
    cy.get('[data-testid="event-card"]').each(($card) => {
      cy.wrap($card).should('exist');
    }).then(() => {
      cy.get('div').contains(/\d{1,2}:\d{2}/).each(($time) => {
        const timeText = $time.text();
        const match = timeText.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const hours = Number(match[1]);
          expect(hours).to.be.gte(0);
          expect(hours).to.be.lte(27);
        }
      });
    });
  });

  it('should be responsive on mobile viewport', () => {
    cy.viewport('iphone-x');
    cy.get('[data-testid="event-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="event-card"]').first().should('be.visible');
  });
});
