/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEvents } from '../useEvents';
import { SAMPLE_EVENTS } from '../../constants/sampleEvents';
import type { Event } from '../../types';

global.fetch = jest.fn();

describe('useEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    // エラーハンドリング：APIフェッチ失敗時は SAMPLE_EVENTS にフォールバック
    test('initializes with empty events on first load', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(SAMPLE_EVENTS.length);
      });
    });

    // 永続化：localStorage からお気に入り一覧を復元する
    test('loads favorites from localStorage on initialization', () => {
      const favs = ['1', '2', '3'];
      localStorage.setItem('favorites', JSON.stringify(favs));

      const { result } = renderHook(() => useEvents());

      expect(Array.from(result.current.favorites)).toEqual(favs);
    });

    // 初期状態：localStorage にお気に入りデータがない場合は空Set
    test('initializes with empty favorites when localStorage is empty', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.favorites.size).toBe(0);
    });

    // 初期状態：全フィルター（リーグ・放送局・検索・お気に入り）が未アクティブ
    test('initializes with empty filters', () => {
      const { result } = renderHook(() => useEvents());

      expect(result.current.activeLeagues.size).toBe(0);
      expect(result.current.activeCasts.size).toBe(0);
      expect(result.current.query).toBe('');
      expect(result.current.favOnly).toBe(false);
    });
  });

  describe('Event loading', () => {
    // エラーハンドリング：events.json が 404/50x を返した場合は SAMPLE_EVENTS にフォールバック
    test('falls back to SAMPLE_EVENTS when events.json response is not ok', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toEqual(SAMPLE_EVENTS);
      });
    });

    // 正常系：events.json から読み込んだイベント配列を状態に設定
    test('loads events from events.json', async () => {
      const mockEvents = [
        { id: 1, lg: 'wc2026', date: '2026-06-14', day: '土', time: '05:00', title: 'Test', cat: 'Test', casts: ['dazn'] },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
        expect(result.current.events[0].title).toBe('Test');
      });
    });

    // エラーハンドリング：ネットワークエラーや JSON パースエラーは SAMPLE_EVENTS にフォールバック
    test('falls back to SAMPLE_EVENTS when events.json fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toEqual(SAMPLE_EVENTS);
      });
    });

    // データマージ：results.json の試合結果を events 配列と統合（result フィールドに追加）
    test('merges results from results.json with events', async () => {
      const mockEvents: Event[] = [
        { id: '1', lg: 'wc2026', date: '2026-06-14', day: '土', time: '05:00', title: 'Test', cat: 'Test', casts: ['dazn'] },
      ];
      const mockResults = {
        '1': { status: 'finished' as const, score: { home: 2, away: 1 } },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResults,
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events[0].result).toEqual(mockResults['1']);
      });
    });

    // グレースフルデグラデーション：results.json 取得失敗時はイベント本体だけを返す
    test('returns events without results when results.json fails', async () => {
      const mockEvents: Event[] = [
        { id: '1', lg: 'wc2026', date: '2026-06-14', day: '土', time: '05:00', title: 'Test', cat: 'Test', casts: ['dazn'] },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
        expect(result.current.events[0].result).toBeUndefined();
      });
    });

    // エッジケース：events.json が空配列を返した場合（例：データなしの場合）は SAMPLE_EVENTS にフォールバック
    test('falls back to SAMPLE_EVENTS when events array is empty', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toEqual(SAMPLE_EVENTS);
      });
    });
  });

  describe('League filtering', () => {
    // 状態管理：toggleLeague でリーグを activeLeagues Set に追加（トグル機能）
    test('toggleLeague adds a league to activeLeagues', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
      });

      expect(result.current.activeLeagues.has('wc2026')).toBe(true);
    });

    // トグル機能：同じリーグを2回トグルすると元の状態（非選択）に戻る
    test('toggleLeague removes a league from activeLeagues', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
        result.current.toggleLeague('wc2026');
      });

      expect(result.current.activeLeagues.has('wc2026')).toBe(false);
    });

    // フィルター機能：単一リーグ選択時は filtered に該当リーグのイベントのみ
    test('filters events by single league', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
      });

      expect(result.current.filtered.every((e) => e.lg === 'wc2026')).toBe(true);
    });

    // フィルター機能：複数リーグ選択時は OR ロジック（どちらかのリーグ）
    test('filters events by multiple leagues', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
        result.current.toggleLeague('jleague');
      });

      expect(
        result.current.filtered.every((e) => e.lg === 'wc2026' || e.lg === 'jleague')
      ).toBe(true);
    });

    // リセット状態：リーグフィルター未設定時は全イベントを表示
    test('shows all events when no leagues are filtered', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      expect(result.current.filtered.length).toBe(result.current.events.length);
    });
  });

  describe('Broadcaster filtering', () => {
    // 状態管理：toggleCast で放送局を activeCasts Set に追加
    test('toggleCast adds a broadcaster to activeCasts', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleCast('dazn');
      });

      expect(result.current.activeCasts.has('dazn')).toBe(true);
    });

    // フィルター機能：指定の放送局を持つイベントのみを表示（casts 配列に含まれるチェック）
    test('filters events by broadcaster', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleCast('dazn');
      });

      expect(result.current.filtered.every((e) => e.casts.includes('dazn'))).toBe(true);
    });

    // フィルター機能：複数放送局選択時は OR ロジック（いずれかの放送局に該当）
    test('filters events by multiple broadcasters (OR logic)', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleCast('dazn');
        result.current.toggleCast('ntv');
      });

      expect(
        result.current.filtered.every((e) => e.casts.includes('dazn') || e.casts.includes('ntv'))
      ).toBe(true);
    });
  });

  describe('Text search filtering', () => {
    // テキスト検索：タイトル（title フィールド）で部分一致検索
    test('filters events by search query', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setQuery('日本');
      });

      expect(result.current.filtered.every((e) => e.title.includes('日本'))).toBe(true);
    });

    // リセット：空の検索クエリで全イベント表示
    test('shows all events when search query is empty', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setQuery('');
      });

      expect(result.current.filtered.length).toBe(result.current.events.length);
    });

    // エッジケース：空白のみのクエリは空文字列と同じ扱い（trim 処理）
    test('ignores whitespace in search query', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.setQuery('   ');
      });

      expect(result.current.filtered.length).toBe(result.current.events.length);
    });
  });

  describe('Favorites filtering', () => {
    // 状態管理：toggleFavorite でイベントをお気に入り Set に追加
    test('toggleFavorite adds event to favorites', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleFavorite('1');
      });

      expect(result.current.favorites.has('1')).toBe(true);
    });

    // トグル機能：同じイベントを2回トグルすると元の状態に戻る
    test('toggleFavorite removes event from favorites', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleFavorite('1');
        result.current.toggleFavorite('1');
      });

      expect(result.current.favorites.has('1')).toBe(false);
    });

    // フィルター機能：favOnly = true 時は favorites に含まれるイベントのみ表示
    test('filters events by favorites when favOnly is true', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleFavorite('1');
        result.current.setFavOnly(true);
      });

      expect(result.current.filtered.every((e) => result.current.favorites.has(e.id))).toBe(true);
    });

    // リセット：favOnly = false 時は全イベント表示（お気に入り状態は保持）
    test('shows all events when favOnly is false', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleFavorite('1');
      });

      expect(result.current.filtered.length).toBe(result.current.events.length);
    });

    // 永続化：favorites Set の内容を localStorage に自動保存
    test('saves favorites to localStorage', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleFavorite('1');
        result.current.toggleFavorite('2');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('favorites');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed).toContain('1');
        expect(parsed).toContain('2');
      });
    });

    // クリーンアップ：お気に入りが空になったら localStorage のエントリを削除
    test('removes favorites entry from localStorage when empty', async () => {
      localStorage.setItem('favorites', JSON.stringify(['1']));

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.favorites.has('1')).toBe(true);
      });

      act(() => {
        result.current.toggleFavorite('1');
      });

      await waitFor(() => {
        expect(localStorage.getItem('favorites')).toBeNull();
      });
    });
  });

  describe('Combined filtering', () => {
    // フィルター複合：AND ロジック（リーグ かつ 放送局）で結果を絞り込む
    test('applies league and broadcaster filters together', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
        result.current.toggleCast('dazn');
      });

      expect(
        result.current.filtered.every((e) => e.lg === 'wc2026' && e.casts.includes('dazn'))
      ).toBe(true);
    });

    // フィルター複合（全種類）：リーグ AND 放送局 AND お気に入り のすべての条件を満たす
    test('applies all filter types together', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
        result.current.toggleCast('dazn');
        result.current.toggleFavorite('1');
        result.current.setFavOnly(true);
      });

      expect(
        result.current.filtered.every(
          (e) => e.lg === 'wc2026' && e.casts.includes('dazn') && result.current.favorites.has(e.id)
        )
      ).toBe(true);
    });

    // UI表示：アクティブなフィルター数を counted（リーグ1個 = 1, 放送局1個 = 1, favOnly = 1）
    test('activeFilterCount reflects all active filters', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      expect(result.current.activeFilterCount).toBe(0);

      act(() => {
        result.current.toggleLeague('wc2026');
      });

      expect(result.current.activeFilterCount).toBe(1);

      act(() => {
        result.current.toggleCast('dazn');
      });

      expect(result.current.activeFilterCount).toBe(2);

      act(() => {
        result.current.setFavOnly(true);
      });

      expect(result.current.activeFilterCount).toBe(3);
    });
  });

  describe('Sorting', () => {
    // ソート機能：イベントが日付昇順でソートされる
    test('sorts events by date', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      for (let i = 0; i < result.current.filtered.length - 1; i++) {
        expect(result.current.filtered[i].date <= result.current.filtered[i + 1].date).toBe(true);
      }
    });

    // ソート機能：同一日内では時刻昇順（秒単位で計算：HH:MM → 分単位）
    test('sorts events by time within same date', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      const eventsByDate = new Map<string, Event[]>();
      for (const e of result.current.filtered) {
        if (!eventsByDate.has(e.date)) {
          eventsByDate.set(e.date, []);
        }
        eventsByDate.get(e.date)!.push(e);
      }

      for (const events of eventsByDate.values()) {
        for (let i = 0; i < events.length - 1; i++) {
          const [h1, m1] = events[i].time.split(':').map(Number);
          const [h2, m2] = events[i + 1].time.split(':').map(Number);
          const minutes1 = h1 * 60 + m1;
          const minutes2 = h2 * 60 + m2;
          expect(minutes1 <= minutes2).toBe(true);
        }
      }
    });

    // ソート（エッジケース）：24:00以上の深夜時刻を正しく処理（26:00 > 12:00 なので後ろに）
    test('correctly handles midnight times (26:00) in sorting', async () => {
      const mockEvents: Event[] = [
        { id: 1, lg: 'wc2026', date: '2026-06-14', day: '土', time: '05:00', title: 'A', cat: 'Cat', casts: ['dazn'] },
        { id: 2, lg: 'wc2026', date: '2026-06-14', day: '土', time: '26:00', title: 'B', cat: 'Cat', casts: ['dazn'] },
        { id: 3, lg: 'wc2026', date: '2026-06-14', day: '土', time: '12:00', title: 'C', cat: 'Cat', casts: ['dazn'] },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(3);
      });

      expect(result.current.filtered[0].title).toBe('A');
      expect(result.current.filtered[1].title).toBe('C');
      expect(result.current.filtered[2].title).toBe('B');
    });
  });

  describe('Grouping', () => {
    // グループ化：filtered イベントを日付ごとに [date, events[]] の配列に分類
    test('groups events by date', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.groups.length).toBeGreaterThan(0);
      });

      for (const [date, events] of result.current.groups) {
        expect(events.every((e: Event) => e.date === date)).toBe(true);
      }
    });

    // ソート：グループも日付昇順で並ぶ
    test('groups are ordered by date', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.groups.length).toBeGreaterThan(0);
      });

      for (let i = 0; i < result.current.groups.length - 1; i++) {
        expect(result.current.groups[i][0] <= result.current.groups[i + 1][0]).toBe(true);
      }
    });

    // フィルター反映：groups は filtered 配列に基づくため、フィルター適用時は該当イベントのみグループ化
    test('groups respects active filters', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
      });

      for (const [, events] of result.current.groups) {
        expect(events.every((e: Event) => e.lg === 'wc2026')).toBe(true);
      }
    });
  });

  describe('Clear all filters', () => {
    // リセット機能：全フィルター状態（リーグ・放送局・検索・お気に入り）を初期化
    test('clearAll resets all filters', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
        result.current.toggleCast('dazn');
        result.current.setQuery('test');
        result.current.setFavOnly(true);
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.activeLeagues.size).toBe(0);
      expect(result.current.activeCasts.size).toBe(0);
      expect(result.current.query).toBe('');
      expect(result.current.favOnly).toBe(false);
    });

    // リセット結果：全イベントが表示される（filtered = events）
    test('clearAll shows all events', async () => {
      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.toggleLeague('wc2026');
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.filtered.length).toBe(result.current.events.length);
    });
  });

  describe('Ongoing event detection', () => {
    // リアルタイム検出：現在時刻と一致するイベントが存在すれば isOngoing = true
    test('detects ongoing match based on current time', async () => {
      const now = new Date();
      const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const jstDateStr = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}-${String(jstNow.getUTCDate()).padStart(2, '0')}`;
      const currentHour = String(jstNow.getUTCHours()).padStart(2, '0');
      const currentMinute = String(jstNow.getUTCMinutes()).padStart(2, '0');

      const mockEvents: Event[] = [
        { id: 1, lg: 'wc2026', date: jstDateStr, day: '土', time: `${currentHour}:${currentMinute}`, title: 'Ongoing', cat: 'Cat', casts: ['dazn'] },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isOngoing).toBe(true);
      });
    });

    // 時間判定：過去のイベント（2020-01-01）は開催中 = false
    test('does not detect ongoing match for past events', async () => {
      const mockEvents: Event[] = [
        { id: 1, lg: 'wc2026', date: '2020-01-01', day: '土', time: '12:00', title: 'Past', cat: 'Cat', casts: ['dazn'] },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isOngoing).toBe(false);
      });
    });

    // 時間判定：未来のイベント（2099-01-01）は開催中 = false
    test('does not detect ongoing match for future events', async () => {
      const mockEvents: Event[] = [
        { id: 1, lg: 'wc2026', date: '2099-01-01', day: '土', time: '12:00', title: 'Future', cat: 'Cat', casts: ['dazn'] },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEvents,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isOngoing).toBe(false);
      });
    });
  });
});
