/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { EventDetailModal } from '../EventDetailModal';
import * as envModule from '../../config/env';
import type { Event } from '../../types';

// Mock Gemini API
global.fetch = jest.fn();

// Mock the getGeminiApiKey function
jest.mock('../../config/env', () => ({
  getGeminiApiKey: jest.fn(),
}));

describe('EventDetailModal', () => {
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
    event: baseEvent,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (envModule.getGeminiApiKey as jest.Mock).mockReturnValue(undefined);
  });

  describe('Basic rendering', () => {
    test('renders event time', () => {
      render(<EventDetailModal {...defaultProps} />);
      expect(screen.getByText('05:00')).toBeInTheDocument();
    });

    test('renders league label in header', () => {
      render(<EventDetailModal {...defaultProps} />);
      expect(screen.getByText('FIFA W杯')).toBeInTheDocument();
    });

    test('renders event title', () => {
      render(<EventDetailModal {...defaultProps} />);
      expect(screen.getByText('日本 vs ブラジル')).toBeInTheDocument();
    });

    test('renders category for non-F1 events', () => {
      render(<EventDetailModal {...defaultProps} />);
      expect(screen.getByText('グループステージ')).toBeInTheDocument();
    });

    test('does not render category for F1 events', () => {
      const f1Event = { ...baseEvent, lg: 'f1' as const };
      render(<EventDetailModal {...defaultProps} event={f1Event} />);
      expect(screen.queryByText('レース')).not.toBeInTheDocument();
    });

    test('renders broadcaster chips', () => {
      render(<EventDetailModal {...defaultProps} />);
      expect(screen.getByText('DAZN')).toBeInTheDocument();
      expect(screen.getByText('日本テレビ')).toBeInTheDocument();
    });
  });

  describe('Close button', () => {
    test('calls onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<EventDetailModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('閉じる');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Time formatting', () => {
    test('shows "翌日" text for midnight hour (>= 24)', () => {
      const lateEvent = { ...baseEvent, time: '26:00' };
      render(<EventDetailModal {...defaultProps} event={lateEvent} />);
      expect(screen.getByText('（翌日）')).toBeInTheDocument();
    });

    test('does not show "翌日" text for daytime hours', () => {
      render(<EventDetailModal {...defaultProps} />);
      expect(screen.queryByText('（翌日）')).not.toBeInTheDocument();
    });
  });

  describe('Soccer match result display', () => {
    test('renders match with team information when result exists', () => {
      const matchWithResult: Event = {
        ...baseEvent,
        title: 'Japan vs Brazil',
        result: {
          status: 'scheduled',
          teams: {
            home: { id: 1, crest: '' },
            away: { id: 2, crest: '' },
          },
        },
      };
      render(<EventDetailModal {...defaultProps} event={matchWithResult} />);

      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    test('renders standard title when no result data', () => {
      const noResultEvent = { ...baseEvent };
      render(<EventDetailModal {...defaultProps} event={noResultEvent} />);

      expect(screen.getByText('日本 vs ブラジル')).toBeInTheDocument();
    });
  });

  describe('F1 result display', () => {
    test('renders F1 event without breaking', () => {
      const f1Event: Event = {
        id: 'f1-1',
        lg: 'f1',
        date: '2026-04-05',
        day: '日',
        time: '20:00',
        title: 'バーレーン GP',
        cat: 'レース',
        casts: ['wowow'],
      };
      render(<EventDetailModal {...defaultProps} event={f1Event} />);

      expect(screen.getByText('バーレーン GP')).toBeInTheDocument();
      expect(screen.queryByText('カテゴリー')).not.toBeInTheDocument();
    });
  });

  describe('AI Prediction button', () => {
    test('does not show AI prediction button for finished matches', () => {
      const finishedMatch: Event = {
        ...baseEvent,
        result: {
          status: 'finished',
          score: { home: 1, away: 0 },
          teams: {
            home: { id: 1, crest: '' },
            away: { id: 2, crest: '' },
          },
        },
      };
      render(<EventDetailModal {...defaultProps} event={finishedMatch} />);

      expect(screen.queryByText('AI予想')).not.toBeInTheDocument();
    });

    test('shows AI prediction button for upcoming matches', () => {
      render(<EventDetailModal {...defaultProps} />);
      expect(screen.getByText('AI予想')).toBeInTheDocument();
    });

    test('renders button when API key is available', () => {
      (envModule.getGeminiApiKey as jest.Mock).mockReturnValue('test-key');
      render(<EventDetailModal {...defaultProps} />);

      expect(screen.getByText('AI予想')).toBeInTheDocument();
    });

    test('button shows loading text when prediction is fetching', async () => {
      (envModule.getGeminiApiKey as jest.Mock).mockReturnValue('test-key');
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({
                  candidates: [
                    {
                      content: {
                        parts: [{ text: '予想：テスト\n\n解説：テスト。' }],
                      },
                    },
                  ],
                }),
              });
            }, 100);
          })
      );

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      expect(screen.getByText('読込中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('テスト')).toBeInTheDocument();
      });
    });
  });

  describe('Gemini API integration', () => {
    beforeEach(() => {
      (envModule.getGeminiApiKey as jest.Mock).mockReturnValue('test-key');
    });

    test('calls Gemini API with correct prompt for soccer', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '予想：日本\n\n解説：日本チームの実力が上回ると予想されます。',
                  },
                ],
              },
            },
          ],
        }),
      });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('calls Gemini API with correct prompt for F1', async () => {
      const f1Event: Event = {
        ...baseEvent,
        lg: 'f1',
        title: 'バーレーン GP',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '予想：Red Bull Racing\n\n解説：マシンの性能が高いため。',
                  },
                ],
              },
            },
          ],
        }),
      });

      render(<EventDetailModal {...defaultProps} event={f1Event} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    test('handles rate limit (429) and tries next model', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 429 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: '予想：日本\n\n解説：強いチームです。' }],
                },
              },
            ],
          }),
        });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/強いチームです/)).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/APIキーが無効です/)).toBeInTheDocument();
      });
    });

    test('shows error when all models exhaust rate limit', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 429 });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/APIの使用上限に達しました/)).toBeInTheDocument();
      });
    });
  });

  describe('Prediction parsing', () => {
    beforeEach(() => {
      (envModule.getGeminiApiKey as jest.Mock).mockReturnValue('test-key');
    });

    test('parses prediction with correct format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '予想：日本\n\n解説：日本が強いから。',
                  },
                ],
              },
            },
          ],
        }),
      });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('日本')).toBeInTheDocument();
        expect(screen.getByText(/日本が強いから/)).toBeInTheDocument();
      });
    });

    test('handles prediction without proper format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Malformed response without proper format',
                  },
                ],
              },
            },
          ],
        }),
      });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/予想を取得できませんでした/)
        ).toBeInTheDocument();
      });
    });

    test('displays used model information', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '予想：日本\n\n解説：テスト。',
                  },
                ],
              },
            },
          ],
        }),
      });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/gemini-2.5-flash/)).toBeInTheDocument();
      });
    });
  });

  describe('Soccer match edge cases', () => {
    beforeEach(() => {
      (envModule.getGeminiApiKey as jest.Mock).mockReturnValue('test-key');
    });

    test('prevents prediction for unconfirmed opponents (TBD)', async () => {
      const unconfirmedMatch: Event = {
        ...baseEvent,
        title: '日本 vs TBD',
      };

      render(<EventDetailModal {...defaultProps} event={unconfirmedMatch} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/対戦カードがまだ決まっていない/)
        ).toBeInTheDocument();
      });
    });

    test('prevents prediction for single opponent name', async () => {
      const invalidMatch: Event = {
        ...baseEvent,
        title: 'Single Team Name',
      };

      render(<EventDetailModal {...defaultProps} event={invalidMatch} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/対戦カードがまだ決まっていない/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Multiple broadcasters', () => {
    test('renders all broadcaster chips', () => {
      const eventWithMultipleCasts = {
        ...baseEvent,
        casts: ['dazn', 'ntv', 'fuji'],
      };
      render(<EventDetailModal {...defaultProps} event={eventWithMultipleCasts} />);

      expect(screen.getByText('DAZN')).toBeInTheDocument();
      expect(screen.getByText('日本テレビ')).toBeInTheDocument();
      expect(screen.getByText('フジテレビ')).toBeInTheDocument();
    });
  });

  describe('League specific rendering', () => {
    test('renders Jリーグ event with correct label', () => {
      const jleagueEvent = {
        ...baseEvent,
        lg: 'jleague' as const,
        title: '浦和 vs 鹿島',
        cat: 'J1',
      };
      render(<EventDetailModal {...defaultProps} event={jleagueEvent} />);
      expect(screen.getByText('Jリーグ')).toBeInTheDocument();
    });

    test('renders International match event', () => {
      const intlEvent = {
        ...baseEvent,
        lg: 'intl' as const,
        title: '日本 vs ドイツ',
        cat: 'テストマッチ',
      };
      render(<EventDetailModal {...defaultProps} event={intlEvent} />);
      expect(screen.getByText('海外サッカー')).toBeInTheDocument();
    });

    test('renders Olympic event', () => {
      const olympicEvent = {
        ...baseEvent,
        lg: 'olympic' as const,
        title: '日本 vs アメリカ',
        cat: '予選',
      };
      render(<EventDetailModal {...defaultProps} event={olympicEvent} />);
      expect(screen.getByText('オリンピック')).toBeInTheDocument();
    });
  });

  describe('API Key and Alert handling', () => {
    test('shows alert when API key is missing', async () => {
      (envModule.getGeminiApiKey as jest.Mock).mockReturnValue(undefined);
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      expect(alertMock).toHaveBeenCalledWith('APIキーが設定されていません');

      alertMock.mockRestore();
    });
  });

  describe('Match result rendering with images', () => {
    test('renders finished match with home team crest', () => {
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
      const { container } = render(<EventDetailModal {...defaultProps} event={finishedMatch} />);
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('renders scheduled match with team crests', () => {
      const scheduledMatch: Event = {
        ...baseEvent,
        title: 'Germany vs France',
        result: {
          status: 'scheduled',
          teams: {
            home: {
              id: 1,
              crest: 'https://example.com/germany.png',
            },
            away: {
              id: 2,
              crest: 'https://example.com/france.png',
            },
          },
        },
      };
      const { container } = render(<EventDetailModal {...defaultProps} event={scheduledMatch} />);
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    test('renders finished match with half time score', () => {
      const finishedWithHalfTime: Event = {
        ...baseEvent,
        title: 'Spain vs Italy',
        result: {
          status: 'finished',
          score: {
            home: 3,
            away: 2,
          },
          halfTime: {
            home: 1,
            away: 1,
          },
          teams: {
            home: { id: 1, crest: '' },
            away: { id: 2, crest: '' },
          },
        },
      };
      render(<EventDetailModal {...defaultProps} event={finishedWithHalfTime} />);
      expect(screen.getByText(/Half Time:/)).toBeInTheDocument();
    });

  });

  describe('F1 result standings display', () => {
    test('renders F1 race with full standings', () => {
      const f1WithStandings: Event = {
        id: 'f1-2',
        lg: 'f1',
        date: '2026-05-10',
        day: '日',
        time: '15:00',
        title: 'スペイン GP',
        cat: 'レース',
        casts: ['wowow'],
        result: {
          status: 'finished',
          standings: [
            { position: 1, points: 25, driver: 'Max Verstappen', constructor: 'Red Bull', status: 'finished' },
            { position: 2, points: 18, driver: 'Lando Norris', constructor: 'McLaren', status: 'finished' },
            { position: 3, points: 15, driver: 'Lewis Hamilton', constructor: 'Mercedes', status: 'finished' },
            { position: 4, points: 12, driver: 'Charles Leclerc', constructor: 'Ferrari', status: 'finished' },
          ],
        },
      };
      render(<EventDetailModal {...defaultProps} event={f1WithStandings} />);
      expect(screen.getByText(/レース結果/)).toBeInTheDocument();
      expect(screen.getByText(/Max Verstappen/)).toBeInTheDocument();
      expect(screen.getByText(/Charles Leclerc/)).toBeInTheDocument();
      expect(screen.getByText(/25pt/)).toBeInTheDocument();
    });

    test('renders F1 qualifying session (no points display)', () => {
      const f1Qualifying: Event = {
        id: 'f1-3-q',
        lg: 'f1',
        date: '2026-06-13',
        day: '土',
        time: '14:00',
        title: 'イギリス GP (予選)',
        cat: 'レース',
        casts: ['wowow'],
        result: {
          status: 'finished',
          standings: [
            { position: 1, points: 0, driver: 'Carlos Sainz', constructor: 'Ferrari', status: 'finished' },
            { position: 2, points: 0, driver: 'George Russell', constructor: 'Mercedes', status: 'finished' },
          ],
        },
      };
      render(<EventDetailModal {...defaultProps} event={f1Qualifying} />);
      expect(screen.getByText(/レース結果/)).toBeInTheDocument();
      expect(screen.getByText(/Carlos Sainz/)).toBeInTheDocument();
    });
  });

  describe('Match status display', () => {
    test('displays ongoing status correctly', () => {
      const ongoingMatch: Event = {
        ...baseEvent,
        result: {
          status: 'ongoing',
          teams: {
            home: { id: 1, crest: '' },
            away: { id: 2, crest: '' },
          },
        },
      };
      render(<EventDetailModal {...defaultProps} event={ongoingMatch} />);
      expect(screen.getByText(/ステータス：進行中/)).toBeInTheDocument();
    });

    test('displays finished status correctly', () => {
      const finishedMatch: Event = {
        ...baseEvent,
        result: {
          status: 'finished',
          score: { home: 1, away: 0 },
          teams: {
            home: { id: 1, crest: '' },
            away: { id: 2, crest: '' },
          },
        },
      };
      render(<EventDetailModal {...defaultProps} event={finishedMatch} />);
      expect(screen.getByText(/ステータス：終了/)).toBeInTheDocument();
    });

    test('displays scheduled status correctly', () => {
      const scheduledMatch: Event = {
        ...baseEvent,
        result: {
          status: 'scheduled',
          teams: {
            home: { id: 1, crest: '' },
            away: { id: 2, crest: '' },
          },
        },
      };
      render(<EventDetailModal {...defaultProps} event={scheduledMatch} />);
      expect(screen.getByText(/ステータス：予定/)).toBeInTheDocument();
    });
  });

  describe('Image rendering and crest display', () => {
    test('renders finished match with home crest image', () => {
      const finishedWithHomeCrest: Event = {
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
            away: { id: 2 },
          },
        },
      };
      const { container } = render(<EventDetailModal {...defaultProps} event={finishedWithHomeCrest} />);
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
    });

    test('renders scheduled match with away crest image', () => {
      const scheduledWithAwayCrest: Event = {
        ...baseEvent,
        title: 'Team A vs Team B',
        result: {
          status: 'scheduled',
          teams: {
            home: { id: 1 },
            away: {
              id: 2,
              crest: 'https://example.com/team-b.png',
            },
          },
        },
      };
      const { container } = render(<EventDetailModal {...defaultProps} event={scheduledWithAwayCrest} />);
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
    });

    test('renders both team crests when available in finished match', () => {
      const bothCrests: Event = {
        ...baseEvent,
        title: 'Home Team vs Away Team',
        result: {
          status: 'finished',
          score: {
            home: 1,
            away: 1,
          },
          teams: {
            home: {
              id: 1,
              crest: 'https://example.com/home.png',
            },
            away: {
              id: 2,
              crest: 'https://example.com/away.png',
            },
          },
        },
      };
      const { container } = render(<EventDetailModal {...defaultProps} event={bothCrests} />);
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
    });

    test('renders both team crests when available in scheduled match', () => {
      const scheduledBothCrests: Event = {
        ...baseEvent,
        title: 'Team 1 vs Team 2',
        result: {
          status: 'scheduled',
          teams: {
            home: {
              id: 1,
              crest: 'https://example.com/team1.png',
            },
            away: {
              id: 2,
              crest: 'https://example.com/team2.png',
            },
          },
        },
      };
      const { container } = render(<EventDetailModal {...defaultProps} event={scheduledBothCrests} />);
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error response handling edge cases', () => {
    beforeEach(() => {
      (envModule.getGeminiApiKey as jest.Mock).mockReturnValue('test-key');
    });

    test('handles 503 error followed by successful response', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 503 })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: '予想：日本\n\n解説：予測。' }],
                },
              },
            ],
          }),
        });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('日本')).toBeInTheDocument();
      });
    });

    test('handles empty text response that continues to next model', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: '' }] } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: '予想：チーム\n\n解説：動作。' }],
                },
              },
            ],
          }),
        });

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('チーム')).toBeInTheDocument();
      });
    });

    test('throws 503 error when all models fail', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error('AIがすこし忙しそうです。もう一回ためしてね！'))
      );

      render(<EventDetailModal {...defaultProps} />);

      const button = screen.getByText('AI予想');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/エラー/)).toBeInTheDocument();
      });
    });
  });
});
