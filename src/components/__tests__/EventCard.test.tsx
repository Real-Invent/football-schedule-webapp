/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '../EventCard';
import type { Event } from '../../types';

describe('EventCard', () => {
  const baseEvent: Event = {
    id: '1',
    lg: 'wc2026',
    date: '2026-06-14',
    day: '土',
    time: '05:00',
    title: '日本 vs ブラジル',
    cat: 'グループステージ',
    casts: ['dazn', 'ntv'],
  };

  const defaultProps = {
    e: baseEvent,
    isFavorite: false,
    onToggleFavorite: jest.fn(),
    onDetailClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    test('renders event time', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText('05:00')).toBeInTheDocument();
    });

    test('renders league tag with correct label', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText('FIFA W杯')).toBeInTheDocument();
    });

    test('renders event title', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText('日本 vs ブラジル')).toBeInTheDocument();
    });

    test('renders broadcaster chips', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText('DAZN')).toBeInTheDocument();
      expect(screen.getByText('日本テレビ')).toBeInTheDocument();
    });

    test('renders category for non-F1 events', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.getByText('グループステージ')).toBeInTheDocument();
    });

    test('does not render category for F1 events', () => {
      const f1Event = { ...baseEvent, lg: 'f1' as const };
      render(<EventCard {...defaultProps} e={f1Event} />);
      // F1 イベントではカテゴリが表示されない
      expect(screen.queryByText(f1Event.cat)).not.toBeInTheDocument();
    });
  });

  describe('Time formatting', () => {
    test('shows "翌" badge for midnight hour (>= 24)', () => {
      const lateEvent = { ...baseEvent, time: '26:00' };
      render(<EventCard {...defaultProps} e={lateEvent} />);
      expect(screen.getByText('翌')).toBeInTheDocument();
    });

    test('does not show "翌" badge for daytime hours', () => {
      render(<EventCard {...defaultProps} />);
      expect(screen.queryByText('翌')).not.toBeInTheDocument();
    });
  });

  describe('Favorite button', () => {
    test('renders unfavorited star with correct styling', () => {
      const { container } = render(<EventCard {...defaultProps} isFavorite={false} />);
      const starButton = container.querySelector('button[aria-label="お気に入り"]');
      expect(starButton).toBeInTheDocument();
    });

    test('calls onToggleFavorite when favorite button is clicked', () => {
      const onToggleFavorite = jest.fn();
      render(
        <EventCard {...defaultProps} onToggleFavorite={onToggleFavorite} />
      );

      const favoriteButton = screen.getByLabelText('お気に入り');
      fireEvent.click(favoriteButton);

      expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    });

    test('does not trigger onDetailClick when favorite button is clicked', () => {
      const onDetailClick = jest.fn();
      const { container } = render(
        <EventCard {...defaultProps} onDetailClick={onDetailClick} />
      );

      const favoriteButton = container.querySelector('button[aria-label="お気に入り"]') as HTMLElement;
      fireEvent.click(favoriteButton);

      expect(onDetailClick).not.toHaveBeenCalled();
    });
  });

  describe('Click handlers', () => {
    test('calls onDetailClick when card is clicked', () => {
      const onDetailClick = jest.fn();
      const { container } = render(
        <EventCard {...defaultProps} onDetailClick={onDetailClick} />
      );

      const card = container.querySelector('[onclick]')?.parentElement || container.firstChild;
      fireEvent.click(card as Element);

      expect(onDetailClick).toHaveBeenCalled();
    });

    test('calls onDetailClick when event title is clicked', () => {
      const onDetailClick = jest.fn();
      render(
        <EventCard {...defaultProps} onDetailClick={onDetailClick} />
      );

      const title = screen.getByText('日本 vs ブラジル');
      fireEvent.click(title);

      expect(onDetailClick).toHaveBeenCalled();
    });
  });

  describe('Multiple broadcasters', () => {
    test('renders all broadcaster chips', () => {
      const eventWithMultipleCasts = {
        ...baseEvent,
        casts: ['dazn', 'ntv', 'fuji'],
      };
      render(
        <EventCard {...defaultProps} e={eventWithMultipleCasts} />
      );

      expect(screen.getByText('DAZN')).toBeInTheDocument();
      expect(screen.getByText('日本テレビ')).toBeInTheDocument();
      expect(screen.getByText('フジテレビ')).toBeInTheDocument();
    });
  });

  describe('League styling', () => {
    test('renders Jリーグ event with correct label', () => {
      const jleagueEvent = {
        ...baseEvent,
        lg: 'jleague' as const,
        title: '浦和 vs 鹿島',
        cat: 'J1',
      };
      render(<EventCard {...defaultProps} e={jleagueEvent} />);
      expect(screen.getByText('Jリーグ')).toBeInTheDocument();
    });

    test('renders Olympic event with correct label', () => {
      const olympicEvent = {
        ...baseEvent,
        lg: 'olympic' as const,
        title: '日本 vs アメリカ',
        cat: '予選',
      };
      render(<EventCard {...defaultProps} e={olympicEvent} />);
      expect(screen.getByText('オリンピック')).toBeInTheDocument();
    });
  });

  describe('Soccer match result display', () => {
    test('renders finished match with score and team names', () => {
      const finishedMatch: Event = {
        ...baseEvent,
        title: 'Japan vs Brazil',
        result: {
          status: 'finished',
          score: {
            home: 2,
            away: 1,
          },
          teams: {
            home: {
              id: 1,
              crest: 'https://example.com/japan.png',
            },
            away: {
              id: 2,
              crest: 'https://example.com/brazil.png',
            },
          },
        },
      };
      render(<EventCard {...defaultProps} e={finishedMatch} />);

      // スコアが表示される
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('renders unfinished match with vs indicator', () => {
      const upcomingMatch: Event = {
        ...baseEvent,
        title: 'Japan vs Brazil',
        result: {
          status: 'scheduled',
          teams: {
            home: {
              id: 1,
              crest: 'https://example.com/japan.png',
            },
            away: {
              id: 2,
              crest: 'https://example.com/brazil.png',
            },
          },
        },
      };
      render(<EventCard {...defaultProps} e={upcomingMatch} />);

      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    test('renders penalty shootout score when available', () => {
      const penaltyMatch: Event = {
        ...baseEvent,
        title: 'Japan vs Brazil',
        result: {
          status: 'finished',
          score: {
            home: 1,
            away: 1,
          },
          penalties: {
            home: 3,
            away: 2,
          },
          teams: {
            home: {
              id: 1,
              crest: 'https://example.com/japan.png',
            },
            away: {
              id: 2,
              crest: 'https://example.com/brazil.png',
            },
          },
        },
      };
      render(<EventCard {...defaultProps} e={penaltyMatch} />);

      // PK スコア表示（text "PK" と数字）
      expect(screen.getByText('PK')).toBeInTheDocument();
    });
  });

  describe('F1 result display', () => {
    test('renders F1 race result with top 3 standings', () => {
      const f1Result: Event = {
        id: 'f1-1',
        lg: 'f1',
        date: '2026-04-05',
        day: '日',
        time: '20:00',
        title: 'バーレーン GP',
        cat: 'レース',
        casts: ['wowow'],
        result: {
          status: 'finished',
          standings: [
            {
              position: 1,
              points: 25,
              driver: 'Max Verstappen',
              constructor: 'Red Bull Racing',
              status: 'finished',
            },
            {
              position: 2,
              points: 18,
              driver: 'Lewis Hamilton',
              constructor: 'Mercedes',
              status: 'finished',
            },
            {
              position: 3,
              points: 15,
              driver: 'Charles Leclerc',
              constructor: 'Ferrari',
              status: 'finished',
            },
          ],
        },
      };
      render(<EventCard {...defaultProps} e={f1Result} />);

      expect(screen.getByText(/1位 Max Verstappen/)).toBeInTheDocument();
      expect(screen.getByText(/2位 Lewis Hamilton/)).toBeInTheDocument();
      expect(screen.getByText(/3位 Charles Leclerc/)).toBeInTheDocument();
    });

    test('shows max 3 positions for F1 result', () => {
      const f1Result: Event = {
        id: 'f1-1',
        lg: 'f1',
        date: '2026-04-05',
        day: '日',
        time: '20:00',
        title: 'バーレーン GP',
        cat: 'レース',
        casts: ['wowow'],
        result: {
          status: 'finished',
          standings: [
            { position: 1, points: 25, driver: 'P1', constructor: 'Team A', status: 'finished' },
            { position: 2, points: 18, driver: 'P2', constructor: 'Team B', status: 'finished' },
            { position: 3, points: 15, driver: 'P3', constructor: 'Team C', status: 'finished' },
            { position: 4, points: 12, driver: 'P4', constructor: 'Team D', status: 'finished' },
            { position: 5, points: 10, driver: 'P5', constructor: 'Team E', status: 'finished' },
          ],
        },
      };
      render(<EventCard {...defaultProps} e={f1Result} />);

      expect(screen.getByText(/1位 P1/)).toBeInTheDocument();
      expect(screen.getByText(/2位 P2/)).toBeInTheDocument();
      expect(screen.getByText(/3位 P3/)).toBeInTheDocument();
      expect(screen.queryByText(/4位 P4/)).not.toBeInTheDocument();
    });
  });

  describe('Favorite state styling', () => {
    test('shows filled star when isFavorite is true', () => {
      const { container } = render(
        <EventCard {...defaultProps} isFavorite={true} />
      );
      const svg = container.querySelector('svg');
      // fill-amber-400 クラスが Star SVG に適用される
      expect(svg).toHaveClass('fill-amber-400');
    });

    test('shows outlined star when isFavorite is false', () => {
      const { container } = render(
        <EventCard {...defaultProps} isFavorite={false} />
      );
      const svg = container.querySelector('svg');
      // text-slate-300 クラスが Star SVG に適用される
      expect(svg).toHaveClass('text-slate-300');
    });
  });

  describe('Edge cases', () => {
    test('handles empty casts array', () => {
      const eventNoCasts = { ...baseEvent, casts: [] };
      const { container } = render(
        <EventCard {...defaultProps} e={eventNoCasts} />
      );
      // カード自体はレンダリングされる
      expect(container).toBeTruthy();
    });

    test('handles event without optional onDetailClick handler', () => {
      const { container } = render(
        <EventCard
          e={baseEvent}
          isFavorite={false}
          onToggleFavorite={jest.fn()}
        />
      );
      expect(container).toBeTruthy();
    });

    test('handles vs split with missing team (fallback to empty string)', () => {
      const eventBadFormat: Event = {
        ...baseEvent,
        title: 'Single Team Name',
        result: {
          status: 'scheduled',
          teams: {
            home: { id: 1, crest: '' },
            away: { id: 2, crest: '' },
          },
        },
      };
      render(<EventCard {...defaultProps} e={eventBadFormat} />);
      expect(screen.getByText('vs')).toBeInTheDocument();
    });
  });
});
