/// <reference types="jest" />
import {
  toJst,
  adjustMidnightTime,
  resolveCasts,
  ja,
  f1ja,
  catja,
  fetchFootball,
  fetchF1,
  fetchFootballResults,
  fetchF1Results,
  fetchF1Championship,
  mkF1,
} from '../fetch-schedule';

describe('fetch-schedule utilities', () => {
  describe('toJst', () => {
    it('converts UTC to JST (+9 hours)', () => {
      const result = toJst('2026-06-14T12:00:00Z');
      expect(result.date).toBe('2026-06-14');
      expect(result.time).toBe('21:00');
    });

    it('handles midnight UTC correctly', () => {
      const result = toJst('2026-06-14T00:00:00Z');
      expect(result.date).toBe('2026-06-14');
      expect(result.time).toBe('09:00');
    });

    it('adjusts early morning times (00:00-03:59) to previous day', () => {
      // UTC 02:00 → JST 11:00 (same day, no adjustment)
      const result1 = toJst('2026-06-14T02:00:00Z');
      expect(result1.date).toBe('2026-06-14');
      expect(result1.time).toBe('11:00');

      // UTC 19:00 → JST 04:00 on next day (04:00 >= 04:00, so no adjustment)
      const result2 = toJst('2026-06-14T19:00:00Z');
      expect(result2.date).toBe('2026-06-15');
      expect(result2.time).toBe('04:00');

      // UTC 18:00 → JST 03:00 on next day → adjusted to previous day 27:00
      const result3 = toJst('2026-06-14T18:00:00Z');
      expect(result3.date).toBe('2026-06-14');
      expect(result3.time).toBe('27:00');
    });

    it('returns correct day of week', () => {
      // 2026-06-14 is Sunday (日)
      const result = toJst('2026-06-14T00:00:00Z');
      expect(result.day).toBe('日');
    });

    it('handles deep night times with adjustment', () => {
      // UTC 18:00 on June 14 → JST 03:00 on June 15 → adjusted to June 14 27:00
      const result = toJst('2026-06-14T18:00:00Z');
      expect(result.date).toBe('2026-06-14');
      expect(result.time).toBe('27:00');
    });
  });

  describe('adjustMidnightTime', () => {
    it('adjusts 00:00-03:59 to previous day 24:00-27:59', () => {
      const result1 = adjustMidnightTime('2026-06-15', '月', '00:30');
      expect(result1.date).toBe('2026-06-14');
      expect(result1.time).toBe('24:30');
      expect(result1.day).toBe('日');

      const result2 = adjustMidnightTime('2026-06-15', '月', '03:59');
      expect(result2.date).toBe('2026-06-14');
      expect(result2.time).toBe('27:59');
    });

    it('does not adjust times >= 04:00', () => {
      const result = adjustMidnightTime('2026-06-15', '月', '04:00');
      expect(result.date).toBe('2026-06-15');
      expect(result.time).toBe('04:00');
      expect(result.day).toBe('月');
    });

    it('does not adjust times >= 12:00', () => {
      const result = adjustMidnightTime('2026-06-15', '月', '21:30');
      expect(result.date).toBe('2026-06-15');
      expect(result.time).toBe('21:30');
    });

    it('handles month boundary correctly', () => {
      const result = adjustMidnightTime('2026-07-01', '水', '02:00');
      expect(result.date).toBe('2026-06-30');
      expect(result.time).toBe('26:00');
    });

    it('handles year boundary correctly', () => {
      const result = adjustMidnightTime('2027-01-01', '金', '01:00');
      expect(result.date).toBe('2026-12-31');
      expect(result.time).toBe('25:00');
    });
  });

  describe('resolveCasts', () => {
    it('returns default casts for wc2026', () => {
      const event = {
        lg: 'wc2026',
        title: 'Argentina vs Uruguay',
        _competition: 'WC',
      };
      const result = resolveCasts(event);
      expect(result).toEqual(['dazn']);
    });

    it('applies overrides for wc2026 Japan matches', () => {
      const event = {
        lg: 'wc2026',
        title: '日本 vs ブラジル',
        _competition: 'WC',
      };
      const result = resolveCasts(event);
      expect(result).toEqual(['dazn', 'nhk', 'ntv', 'fuji']);
    });

    it('applies competition-based casts for intl', () => {
      const event = {
        lg: 'intl',
        title: 'Manchester United vs Liverpool',
        _competition: 'PL',
      };
      const result = resolveCasts(event);
      expect(result).toEqual(['unext', 'abema']);
    });

    it('returns default casts for unknown competition', () => {
      const event = {
        lg: 'intl',
        title: 'Some match',
        _competition: 'UNKNOWN',
      };
      const result = resolveCasts(event);
      expect(result).toEqual([]);
    });

    it('returns empty array for unknown league', () => {
      const event = {
        lg: 'unknown',
        title: 'Some match',
        _competition: '',
      };
      const result = resolveCasts(event);
      expect(result).toEqual([]);
    });

    it('returns default casts for f1', () => {
      const event = {
        lg: 'f1',
        title: 'Japanese Grand Prix 決勝',
        _competition: '',
      };
      const result = resolveCasts(event);
      expect(result).toEqual(['dazn', 'sky']);
    });
  });

  describe('ja (team name translation)', () => {
    it('translates registered team names', () => {
      expect(ja('Japan')).toBe('日本');
      expect(ja('Brazil')).toBe('ブラジル');
      expect(ja('Real Madrid CF')).toBe('レアル・マドリード');
    });

    it('returns original name if not found', () => {
      expect(ja('Unknown Team')).toBe('Unknown Team');
    });
  });

  describe('f1ja (F1 GP name translation)', () => {
    it('translates registered GP names', () => {
      expect(f1ja('Japanese Grand Prix')).toBe('日本GP');
      expect(f1ja('Monaco Grand Prix')).toBe('モナコGP');
    });

    it('returns original name if not found', () => {
      expect(f1ja('Unknown GP')).toBe('Unknown GP');
    });
  });

  describe('catja (category translation)', () => {
    it('translates registered categories', () => {
      expect(catja('GROUP_STAGE')).toBe('グループステージ');
      expect(catja('FINAL')).toBe('決勝');
    });

    it('returns original category if not found', () => {
      expect(catja('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('fetchFootball (with mocked fetch)', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('fetches and transforms football matches correctly', async () => {
      const mockResponse = {
        matches: [
          {
            id: 401234,
            utcDate: '2026-06-14T12:00:00Z',
            homeTeam: { name: 'Japan' },
            awayTeam: { name: 'Brazil' },
            stage: 'GROUP_STAGE',
          },
        ],
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchFootball('wc2026', 'WC', '2026-01-01', '2026-12-31');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'fb-401234',
        lg: 'wc2026',
        date: '2026-06-14',
        title: '日本 vs ブラジル',
        cat: 'グループステージ',
      });
      expect(result[0].casts).toContain('dazn');
      expect(result[0].casts).toContain('nhk');
    });

    it('throws error when API returns non-OK status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as any);

      await expect(fetchFootball('wc2026', 'WC', '2026-01-01', '2026-12-31')).rejects.toThrow(
        /football-data WC: 401/
      );
    });

    it('throws error when FOOTBALL_DATA_TOKEN is not set', async () => {
      const originalToken = process.env.FOOTBALL_DATA_TOKEN;
      delete process.env.FOOTBALL_DATA_TOKEN;

      await expect(fetchFootball('wc2026', 'WC', '2026-01-01', '2026-12-31')).rejects.toThrow(
        'FOOTBALL_DATA_TOKEN is not set'
      );

      process.env.FOOTBALL_DATA_TOKEN = originalToken;
    });
  });

  describe('fetchF1 (with mocked fetch)', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('fetches and transforms F1 races correctly', async () => {
      const mockResponse = {
        MRData: {
          RaceTable: {
            Races: [
              {
                round: '1',
                raceName: 'Bahrain Grand Prix',
                date: '2026-03-15',
                time: '15:00:00',
                Qualifying: {
                  date: '2026-03-14',
                  time: '15:00:00',
                },
              },
            ],
          },
        },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchF1(2026);

      expect(result).toHaveLength(2); // 予選 + 決勝
      expect(result[0].id).toBe('f1-1-q');
      expect(result[0].cat).toBe('予選');
      expect(result[1].id).toBe('f1-1-r');
      expect(result[1].cat).toBe('決勝');
    });

    it('handles races without qualifying', async () => {
      const mockResponse = {
        MRData: {
          RaceTable: {
            Races: [
              {
                round: '1',
                raceName: 'Monaco Grand Prix',
                date: '2026-05-24',
                time: '14:00:00',
              },
            ],
          },
        },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchF1(2026);

      expect(result).toHaveLength(1); // 決勝のみ
      expect(result[0].cat).toBe('決勝');
    });

    it('throws error when API returns non-OK status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

      await expect(fetchF1(2026)).rejects.toThrow('jolpica f1: 500');
    });
  });

  describe('fetchFootballResults (with mocked fetch)', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('fetches and transforms football results correctly', async () => {
      const mockResponse = {
        matches: [
          {
            id: 401234,
            status: 'FINISHED',
            homeTeam: { id: 123 },
            awayTeam: { id: 456 },
            score: {
              fullTime: { home: 2, away: 1 },
              halfTime: { home: 1, away: 0 },
            },
          },
        ],
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchFootballResults('WC', '2026-01-01', '2026-12-31');

      expect(result['fb-401234']).toMatchObject({
        status: 'finished',
        score: { home: 2, away: 1, winner: 'home' },
        halfTime: { home: 1, away: 0 },
      });
    });

    it('handles draw results', async () => {
      const mockResponse = {
        matches: [
          {
            id: 401234,
            status: 'FINISHED',
            homeTeam: { id: 123 },
            awayTeam: { id: 456 },
            score: {
              fullTime: { home: 1, away: 1 },
            },
          },
        ],
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchFootballResults('WC', '2026-01-01', '2026-12-31');

      expect(result['fb-401234'].score?.winner).toBe('draw');
    });

    it('handles scheduled matches without scores', async () => {
      const mockResponse = {
        matches: [
          {
            id: 401234,
            status: 'SCHEDULED',
            homeTeam: { id: 123 },
            awayTeam: { id: 456 },
          },
        ],
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchFootballResults('WC', '2026-01-01', '2026-12-31');

      expect(result['fb-401234']).toMatchObject({
        status: 'scheduled',
      });
      expect(result['fb-401234'].score).toBeUndefined();
    });
  });

  describe('mkF1', () => {
    it('creates F1 event with correct structure', () => {
      const result = mkF1('f1-1-r', 'Japanese Grand Prix', '決勝', {
        date: '2026-10-03',
        day: '土',
        time: '14:00',
      });

      expect(result).toMatchObject({
        id: 'f1-1-r',
        lg: 'f1',
        date: '2026-10-03',
        day: '土',
        time: '14:00',
        title: '日本GP 決勝',
        cat: '決勝',
      });
      expect(result.casts).toEqual(['dazn', 'sky']);
    });
  });

  describe('fetchF1Results (with mocked fetch)', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('fetches qualifying and race results for multiple rounds', async () => {
      const racesResponse = {
        MRData: {
          RaceTable: {
            Races: [
              { round: '1', raceName: 'Bahrain Grand Prix', date: '2026-03-15', time: '15:00:00' },
              { round: '2', raceName: 'Saudi Arabia Grand Prix', date: '2026-03-22', time: '17:00:00' },
            ],
          },
        },
      };

      const qualResponse = {
        MRData: {
          RaceTable: {
            Races: [
              {
                QualifyingResults: [
                  {
                    position: '1',
                    Driver: { givenName: 'Max', familyName: 'Verstappen' },
                    Constructor: { name: 'Red Bull Racing' },
                  },
                  {
                    position: '2',
                    Driver: { givenName: 'Lewis', familyName: 'Hamilton' },
                    Constructor: { name: 'Mercedes' },
                  },
                ],
              },
            ],
          },
        },
      };

      const raceResponse = {
        MRData: {
          RaceTable: {
            Races: [
              {
                Results: [
                  {
                    position: '1',
                    points: '25',
                    Driver: { givenName: 'Max', familyName: 'Verstappen' },
                    Constructor: { name: 'Red Bull Racing' },
                    status: 'Finished',
                  },
                  {
                    position: '2',
                    points: '18',
                    Driver: { givenName: 'Lewis', familyName: 'Hamilton' },
                    Constructor: { name: 'Mercedes' },
                    status: 'Finished',
                  },
                ],
              },
            ],
          },
        },
      };

      let fetchCallCount = 0;
      jest.spyOn(global, 'fetch').mockImplementation((url: any) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        fetchCallCount++;

        if (urlStr.endsWith('.json') && !urlStr.includes('qualifying') && !urlStr.includes('results')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(racesResponse),
          } as any);
        }

        if (urlStr.includes('qualifying')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(qualResponse),
          } as any);
        }

        if (urlStr.includes('results')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(raceResponse),
          } as any);
        }

        return Promise.resolve({ ok: false } as any);
      });

      const result = await fetchF1Results(2026);

      expect(result['f1-1-q']).toBeDefined();
      const qualResult = result['f1-1-q'];
      if (qualResult && qualResult.standings) {
        expect(qualResult.standings[0]).toMatchObject({
          position: 1,
          driver: 'Max Verstappen',
          points: 0,
          status: 'Qualified',
        });
      }

      expect(result['f1-1-r']).toBeDefined();
      const raceResult = result['f1-1-r'];
      if (raceResult && raceResult.standings) {
        expect(raceResult.standings[0]).toMatchObject({
          position: 1,
          points: 25,
          driver: 'Max Verstappen',
          status: 'Finished',
        });
      }
    });

    it('handles missing qualifying results gracefully', async () => {
      const racesResponse = {
        MRData: {
          RaceTable: {
            Races: [
              { round: '1', raceName: 'Bahrain Grand Prix', date: '2026-03-15', time: '15:00:00' },
            ],
          },
        },
      };

      const raceResponse = {
        MRData: {
          RaceTable: {
            Races: [
              {
                Results: [
                  {
                    position: '1',
                    points: '25',
                    Driver: { givenName: 'Max', familyName: 'Verstappen' },
                    Constructor: { name: 'Red Bull Racing' },
                    status: 'Finished',
                  },
                ],
              },
            ],
          },
        },
      };

      jest.spyOn(global, 'fetch').mockImplementation((url: any) => {
        const urlStr = typeof url === 'string' ? url : url.toString();

        if (urlStr.includes('qualifying')) {
          return Promise.resolve({ ok: false } as any);
        }

        if (urlStr.includes('results')) {
          return Promise.resolve({
            ok: true,
            json: jest.fn().mockResolvedValueOnce(raceResponse),
          } as any);
        }

        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(racesResponse),
        } as any);
      });

      const result = await fetchF1Results(2026);

      expect(result['f1-1-q']).toBeUndefined();
      expect(result['f1-1-r']).toBeDefined();
    });

    it('throws error when initial races request fails', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as any);

      await expect(fetchF1Results(2026)).rejects.toThrow('jolpica f1: 500');
    });

    it('handles empty races list', async () => {
      const racesResponse = {
        MRData: {
          RaceTable: {
            Races: [],
          },
        },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(racesResponse),
      } as any);

      const result = await fetchF1Results(2026);

      expect(result).toEqual({});
    });
  });

  describe('fetchF1Championship (with mocked fetch)', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('fetches and transforms championship standings correctly', async () => {
      const mockResponse = {
        MRData: {
          StandingsTable: {
            StandingsLists: [
              {
                DriverStandings: [
                  {
                    position: '1',
                    points: '275',
                    wins: '9',
                    Driver: { givenName: 'Max', familyName: 'Verstappen' },
                    Constructors: [{ name: 'Red Bull Racing' }],
                  },
                  {
                    position: '2',
                    points: '250',
                    wins: '7',
                    Driver: { givenName: 'Lewis', familyName: 'Hamilton' },
                    Constructors: [{ name: 'Mercedes' }],
                  },
                  {
                    position: '3',
                    points: '180',
                    wins: '2',
                    Driver: { givenName: 'Lando', familyName: 'Norris' },
                    Constructors: [],
                  },
                ],
              },
            ],
          },
        },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchF1Championship(2026);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        position: 1,
        driver: 'Max Verstappen',
        constructor: 'Red Bull Racing',
        points: 275,
        wins: 9,
      });
      expect(result[2]).toMatchObject({
        position: 3,
        driver: 'Lando Norris',
        constructor: 'Unknown',
        points: 180,
        wins: 2,
      });
    });

    it('handles missing constructor information', async () => {
      const mockResponse = {
        MRData: {
          StandingsTable: {
            StandingsLists: [
              {
                DriverStandings: [
                  {
                    position: '1',
                    points: '275',
                    wins: '9',
                    Driver: { givenName: 'Max', familyName: 'Verstappen' },
                  },
                ],
              },
            ],
          },
        },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchF1Championship(2026);

      expect(result[0]).toMatchObject({
        position: 1,
        driver: 'Max Verstappen',
        constructor: 'Unknown',
        points: 275,
        wins: 9,
      });
    });

    it('throws error when API returns non-OK status', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      await expect(fetchF1Championship(2026)).rejects.toThrow('jolpica championship: 404');
    });

    it('handles empty standings', async () => {
      const mockResponse = {
        MRData: {
          StandingsTable: {
            StandingsLists: [
              {
                DriverStandings: [],
              },
            ],
          },
        },
      };

      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as any);

      const result = await fetchF1Championship(2026);

      expect(result).toEqual([]);
    });
  });
});
