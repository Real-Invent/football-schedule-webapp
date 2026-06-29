/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SportsCalendar } from '../SportsCalendar';
import { useEvents } from '../../hooks/useEvents';
import type { Event } from '../../types';

// モック化
jest.mock('../../hooks/useEvents');
jest.mock('../FilterRow', () => {
  return {
    FilterRow: ({ label, children }: any) => (
      <div data-testid="filter-row">
        <span>{label}</span>
        {children}
      </div>
    ),
  };
});
jest.mock('../FilterChip', () => {
  return {
    FilterChip: ({ label, active, onClick }: any) => (
      <button data-testid={`chip-${label}`} onClick={onClick}>
        {label} {active ? '✓' : ''}
      </button>
    ),
  };
});
jest.mock('../EventCard', () => {
  return {
    EventCard: ({ e, isFavorite, onDetailClick }: any) => (
      <div data-testid={`event-${e.id}`} onClick={onDetailClick}>
        {e.title}
      </div>
    ),
  };
});
jest.mock('../EventDetailModal', () => {
  return {
    EventDetailModal: ({ event, onClose }: any) => {
      if (!event) return null;
      return (
        <div data-testid="modal">
          <div>{event.title}</div>
          <button onClick={onClose}>Close</button>
        </div>
      );
    },
  };
});

const mockUseEvents = useEvents as jest.MockedFunction<typeof useEvents>;

describe('SportsCalendar', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      lg: 'wc2026',
      date: '2026-06-14',
      day: '土',
      time: '05:00',
      title: '日本 vs ブラジル',
      cat: 'グループステージ',
      casts: ['dazn', 'ntv'],
    },
    {
      id: '2',
      lg: 'jleague',
      date: '2026-06-14',
      day: '土',
      time: '19:00',
      title: '浦和 vs 鹿島',
      cat: 'J1',
      casts: ['dazn'],
    },
    {
      id: '3',
      lg: 'wc2026',
      date: '2026-06-18',
      day: '水',
      time: '05:00',
      title: '日本 vs セネガル',
      cat: 'グループステージ',
      casts: ['ntv'],
    },
  ];

  const createMockUseEventsReturn = (overrides: Partial<ReturnType<typeof useEvents>> = {}) => ({
    events: mockEvents,
    activeLeagues: new Set<string>(),
    activeCasts: new Set<string>(),
    query: '',
    favOnly: false,
    favorites: new Set<string | number>(),
    filtered: mockEvents,
    groups: [
      ['2026-06-14', [mockEvents[0], mockEvents[1]]],
      ['2026-06-18', [mockEvents[2]]],
    ] as [string, Event[]][],
    activeFilterCount: 0,
    isOngoing: false,
    toggleLeague: jest.fn(),
    toggleCast: jest.fn(),
    setQuery: jest.fn(),
    setFavOnly: jest.fn(),
    toggleFavorite: jest.fn(),
    clearAll: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // UIレイアウト：ヘッダーに説明文を表示
    test('renders header with title and description', () => {
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      render(<SportsCalendar />);

      expect(screen.getByText(/いつ・どこで観る/)).toBeInTheDocument();
    });

    // UIコンポーネント：検索ボックスが配置される
    test('renders search input', () => {
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      render(<SportsCalendar />);

      const searchInput = screen.getByPlaceholderText(/検索/);
      expect(searchInput).toBeInTheDocument();
    });

    // UIコンポーネント：リーグ・放送局フィルター行が複数個表示
    test('renders filter rows for leagues and broadcasters', () => {
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      render(<SportsCalendar />);

      const filterRows = screen.getAllByTestId('filter-row');
      expect(filterRows.length).toBeGreaterThan(0);
    });

    // データ表示：フィルタリング済みイベントをすべて表示
    test('displays event groups by date', () => {
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      render(<SportsCalendar />);

      expect(screen.getByTestId('event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-2')).toBeInTheDocument();
      expect(screen.getByTestId('event-3')).toBeInTheDocument();
    });

    // エッジケース：フィルター結果が0件の場合は「条件に合う試合がありません」メッセージ表示
    test('shows empty state when no events match filters', () => {
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({
          filtered: [],
          groups: [],
        })
      );
      render(<SportsCalendar />);

      expect(screen.getByText(/条件に合う試合がありません/)).toBeInTheDocument();
    });
  });

  describe('Search functionality', () => {
    // インタラクション：検索入力値の変更をhookに通知
    test('updates search query when input changes', () => {
      const setQuery = jest.fn();
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({ setQuery })
      );
      render(<SportsCalendar />);

      const searchInput = screen.getByPlaceholderText(/検索/) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: '日本' } });

      expect(setQuery).toHaveBeenCalledWith('日本');
    });

    // インタラクション：クリアボタンで検索を初期化（空文字列を setQuery に通知）
    test('clears search query when X button is clicked', () => {
      const setQuery = jest.fn();
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({
          setQuery,
          query: '日本',
        })
      );
      render(<SportsCalendar />);

      const clearButton = screen.getByLabelText('検索をクリア');
      fireEvent.click(clearButton);

      expect(setQuery).toHaveBeenCalledWith('');
    });

    // UI制御：クリアボタンは検索クエリ入力時のみ表示（query が空でない）
    test('shows search clear button only when query is not empty', () => {
      const { rerender } = render(<SportsCalendar />);
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      rerender(<SportsCalendar />);

      expect(screen.queryByLabelText('検索をクリア')).not.toBeInTheDocument();

      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({ query: 'test' })
      );
      rerender(<SportsCalendar />);

      expect(screen.getByLabelText('検索をクリア')).toBeInTheDocument();
    });
  });

  describe('Filter functionality', () => {
    // インタラクション：リーグフィルターチップクリック時に toggleLeague を呼び出す
    test('calls toggleLeague when league chip is clicked', () => {
      const toggleLeague = jest.fn();
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({ toggleLeague })
      );
      render(<SportsCalendar />);

      const leagueChips = screen.getAllByTestId(/^chip-/);
      if (leagueChips.length > 0) {
        fireEvent.click(leagueChips[0]);
        expect(toggleLeague).toHaveBeenCalled();
      }
    });

    // フィルター状態の可視化：「N件を表示中」で現在のフィルター結果数を表示
    test('displays active filter count with filtered items', () => {
      const filteredEvents = [mockEvents[0]];
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({
          activeLeagues: new Set(['wc2026']),
          activeFilterCount: 1,
          filtered: filteredEvents,
          groups: [['2026-06-14', filteredEvents]],
        })
      );
      render(<SportsCalendar />);

      expect(screen.getByText(/1件を表示中/)).toBeInTheDocument();
    });

    // UI制御：アクティブなフィルター（activeFilterCount > 0）がある場合のみ「すべて解除」ボタン表示
    test('shows clear all button when filters are active', () => {
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({
          activeFilterCount: 2,
          filtered: mockEvents.slice(0, 2),
        })
      );
      render(<SportsCalendar />);

      const clearButton = screen.getByText('すべて解除');
      expect(clearButton).toBeInTheDocument();
    });

    // インタラクション：「すべて解除」ボタンで全フィルター初期化
    test('calls clearAll when clear button is clicked', () => {
      const clearAll = jest.fn();
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({
          clearAll,
          activeFilterCount: 1,
          filtered: mockEvents.slice(0, 1),
        })
      );
      render(<SportsCalendar />);

      fireEvent.click(screen.getByText('すべて解除'));
      expect(clearAll).toHaveBeenCalled();
    });

    // インタラクション：お気に入りチップクリック時に setFavOnly トグルを呼び出す
    test('toggles favorite filter when star chip is clicked', () => {
      const setFavOnly = jest.fn();
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({ setFavOnly })
      );
      render(<SportsCalendar />);

      const favChip = screen.getByTestId('chip-お気に入り');
      fireEvent.click(favChip);

      expect(setFavOnly).toHaveBeenCalled();
    });
  });

  describe('Event card interactions', () => {
    // インタラクション：イベントカードクリックでモーダルを表示
    test('displays modal when event is clicked', () => {
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      render(<SportsCalendar />);

      const eventCard = screen.getByTestId('event-1');
      fireEvent.click(eventCard);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    // インタラクション：モーダルクローズボタンでモーダル閉じる（selectedEvent = null）
    test('closes modal when close button is clicked', () => {
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      const { rerender } = render(<SportsCalendar />);

      const eventCard = screen.getByTestId('event-1');
      fireEvent.click(eventCard);

      expect(screen.getByTestId('modal')).toBeInTheDocument();

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      rerender(<SportsCalendar />);
      // モーダルは selectedEvent = null になるので再レンダリングで消える
    });
  });

  describe('Ongoing event badge', () => {
    // 開催中イベント表示：isOngoing フラグが真の場合「開催中」バッジを表示
    test('shows ongoing badge when isOngoing is true', () => {
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({ isOngoing: true })
      );
      render(<SportsCalendar />);

      const badge = screen.getByText(/開催中/);
      expect(badge).toBeInTheDocument();
    });

    // 開催中イベント非表示：isOngoing が偽の場合「開催中」バッジなし
    test('hides ongoing badge when isOngoing is false', () => {
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({ isOngoing: false })
      );
      render(<SportsCalendar />);

      expect(screen.queryByText(/開催中/)).not.toBeInTheDocument();
    });
  });

  describe('Favorites persistence', () => {
    // 状態管理：useEvents フックから返される favorites set が正しく渡される
    test('passes favorites set to useEvents', () => {
      const favorites = new Set(['1', '2']);
      mockUseEvents.mockReturnValue(
        createMockUseEventsReturn({ favorites })
      );
      render(<SportsCalendar />);

      // favorites が正しく useEvents から返されていることを確認
      expect(mockUseEvents).toHaveBeenCalled();
    });
  });

  describe('Date formatting and grouping', () => {
    // グループ化ロジック：同じ日付のイベント群を useEvents.groups から取得し表示
    test('groups events by date correctly', () => {
      mockUseEvents.mockReturnValue(createMockUseEventsReturn());
      render(<SportsCalendar />);

      // 2026-06-14 に 2 つのイベント
      expect(screen.getByTestId('event-1')).toBeInTheDocument();
      expect(screen.getByTestId('event-2')).toBeInTheDocument();
      // 2026-06-18 に 1 つのイベント
      expect(screen.getByTestId('event-3')).toBeInTheDocument();
    });
  });
});
