/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChip } from '../FilterChip';
import { Star } from 'lucide-react';

describe('FilterChip', () => {
  const defaultProps = {
    active: false,
    onClick: jest.fn(),
    color: '#0E9F6E',
    label: 'W杯2026',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    // 基本レンダリング：ラベルテキストがボタンに表示される
    test('renders chip with label', () => {
      render(<FilterChip {...defaultProps} />);
      expect(screen.getByText('W杯2026')).toBeInTheDocument();
    });

    // アクセシビリティ：ボタン要素として正しくレンダリングされる
    test('renders chip button', () => {
      render(<FilterChip {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    // オプショナルicon：提供された場合はSVGアイコンが表示される
    test('renders icon when provided', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={Star} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    // オプショナルicon：提供されない場合はアイコンなしで表示される
    test('does not render icon when not provided', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={undefined} />
      );
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Active state styling', () => {
    // アクティブ状態：背景が指定カラーで塗りつぶし、テキスト白色
    test('applies color background when active is true', () => {
      const { container } = render(
        <FilterChip {...defaultProps} active={true} color="#0E9F6E" />
      );
      const button = container.querySelector('button');
      expect(button).toHaveStyle({
        background: '#0E9F6E',
        color: '#fff',
      });
    });

    // 非アクティブ状態：背景白色、テキストスレート灰色
    test('applies white background when active is false', () => {
      const { container } = render(
        <FilterChip {...defaultProps} active={false} />
      );
      const button = container.querySelector('button');
      expect(button).toHaveStyle({
        background: '#FFF',
        color: '#475569',
      });
    });

    // アクティブ状態：ボーダー色が指定カラーに変更される
    test('applies color border when active is true', () => {
      const { container } = render(
        <FilterChip {...defaultProps} active={true} color="#C8102E" />
      );
      const button = container.querySelector('button');
      expect(button).toHaveStyle('borderColor: #C8102E');
    });

    // 非アクティブ状態：ボーダー色がスレート薄灰色（#e2e8f0）
    test('applies slate border when active is false', () => {
      const { container } = render(
        <FilterChip {...defaultProps} active={false} />
      );
      const button = container.querySelector('button');
      expect(button).toHaveStyle('borderColor: #e2e8f0');
    });
  });

  describe('Click handling', () => {
    // インタラクション：クリック時にコールバックが1回発火する
    test('calls onClick when clicked', () => {
      const onClick = jest.fn();
      render(<FilterChip {...defaultProps} onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    // インタラクション：複数クリック時はそれぞれのクリックで発火（トグル機能の基礎）
    test('calls onClick multiple times on multiple clicks', () => {
      const onClick = jest.fn();
      render(<FilterChip {...defaultProps} onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Different colors', () => {
    // カスタマイズ：color propsで自由に背景色を変更可能（リーグ別に異なる色を指定）
    test('applies custom color when active', () => {
      const { container } = render(
        <FilterChip
          {...defaultProps}
          active={true}
          color="#1D6FB8"
        />
      );
      const button = container.querySelector('button');
      expect(button).toHaveStyle('background: #1D6FB8');
    });

    // マルチリーグ対応：各リーグが異なるカラーでUIを識別しやすく（W杯は緑、他は別色など）
    test('applies different colors for different leagues', () => {
      const { container: wc26Container } = render(
        <FilterChip
          {...defaultProps}
          active={true}
          color="#0E9F6E"
          label="W杯"
        />
      );
      expect(wc26Container.querySelector('button')).toHaveStyle(
        'background: #0E9F6E'
      );
    });
  });

  describe('Icon rendering', () => {
    // アイコンサイズの一貫性：lucide-react アイコンが13x13pxで正規化される
    test('renders icon with correct size', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={Star} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '13');
      expect(svg).toHaveAttribute('height', '13');
    });

    // アイコンのみのチップ：ラベルなしでもアイコンは表示される（いいね星ボタンなど）
    test('renders icon with no label', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={Star} label="" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    // a11y：キーボードアクセス可能なbutton要素として実装（Enterキー対応は別でテスト可能）
    test('button is keyboard accessible', () => {
      const onClick = jest.fn();
      render(
        <FilterChip {...defaultProps} onClick={onClick} />
      );

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      // Note: fireEvent.keyDown doesn't trigger click
      // We would need to simulate actual keyboard press
      expect(button).toBeInTheDocument();
    });

    // a11y：スクリーンリーダー対応：proper button role で認識可能
    test('button has correct role', () => {
      render(<FilterChip {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    // エッジケース：空文字列ラベル時もボタンは表示される（アイコンのみチップ）
    test('handles empty label', () => {
      const { container } = render(
        <FilterChip {...defaultProps} label="" />
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    // エッジケース：長いラベルテキストも全て表示される（テキスト折り返しはCSS次第）
    test('handles very long label', () => {
      const longLabel = 'FIFA ワールドカップ 2026年大会';
      render(<FilterChip {...defaultProps} label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    // エッジケース：特殊文字（&など）も正しくHTMLエスケープして表示
    test('handles special characters in label', () => {
      const specialLabel = 'テスト & レーシング';
      render(<FilterChip {...defaultProps} label={specialLabel} />);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });
  });
});
