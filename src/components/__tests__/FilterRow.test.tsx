/// <reference types="jest" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FilterRow } from '../FilterRow';

describe('FilterRow', () => {
  const defaultProps = {
    label: 'リーグ',
    children: <button>Test Child</button>,
  };

  describe('Basic rendering', () => {
    // UIレイアウト：ラベル部分が常に表示される
    test('renders label', () => {
      render(<FilterRow {...defaultProps} />);
      expect(screen.getByText('リーグ')).toBeInTheDocument();
    });

    // コンテナ機能：children(フィルターチップなど)を正しく配置
    test('renders children', () => {
      render(<FilterRow {...defaultProps} />);
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    // DOM構造：ラッパーdivが正しく生成される
    test('renders container div', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const filterRow = container.firstChild;
      expect(filterRow).toBeInTheDocument();
    });
  });

  describe('Children handling', () => {
    // React children API：単一の子要素を受け入れ
    test('renders single child element', () => {
      render(
        <FilterRow label="Single" >
          <button>Single Button</button>
        </FilterRow>
      );
      expect(screen.getByText('Single Button')).toBeInTheDocument();
    });

    // React children API：複数の直下の子要素すべてをレンダリング
    test('renders multiple children', () => {
      render(
        <FilterRow label="Multiple">
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </FilterRow>
      );
      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
    });

    // React children API：テキストノードも受け入れ
    test('renders text children', () => {
      render(
        <FilterRow label="Text">
          Text content
        </FilterRow>
      );
      expect(screen.getByText('Text content')).toBeInTheDocument();
    });

    // React children API：ネストされた構造も正しく配置
    test('renders complex children structure', () => {
      render(
        <FilterRow label="Complex">
          <div>
            <span>Nested Content</span>
          </div>
        </FilterRow>
      );
      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });
  });

  describe('Label styling', () => {
    // スタイル：ラベルに小さいフォントサイズ（10px）を適用
    test('applies text styling to label', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const labelDiv = container.querySelector(
        '.text-\\[10px\\]'
      );
      expect(labelDiv).toBeInTheDocument();
    });

    // 動的ラベル：ラベル内容が正しく更新される（rerender時）
    test('renders different labels', () => {
      const { rerender } = render(
        <FilterRow label="リーグ">
          <div>content</div>
        </FilterRow>
      );
      expect(screen.getByText('リーグ')).toBeInTheDocument();

      rerender(
        <FilterRow label="放送局">
          <div>content</div>
        </FilterRow>
      );
      expect(screen.getByText('放送局')).toBeInTheDocument();
    });
  });

  describe('Layout structure', () => {
    // スクロール機能：children（フィルターチップなど）が横スクロール可能
    test('renders with correct CSS class for scrolling', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const scrollContainer = container.querySelector(
        '.overflow-x-auto'
      );
      expect(scrollContainer).toBeInTheDocument();
    });

    // スクロールバー領域の調整：pb-1（下パディング）, -mx-1（マイナスマージン）, px-1（横パディング）
    test('scrolling container has padding and margin', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const scrollContainer = container.querySelector(
        '.overflow-x-auto'
      );
      expect(scrollContainer).toHaveClass('pb-1', '-mx-1', 'px-1');
    });

    // 複数行配置：各フィルター行に下マージン（mb-2）、ただし最後の行は0（last:mb-0）
    test('renders margin bottom utility class', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const row = container.firstChild;
      expect(row).toHaveClass('mb-2', 'last:mb-0');
    });
  });

  describe('Scrollbar styling', () => {
    // スクロールコンテナ：overflow-x-auto, padding, margin のクラスが組み合わさる
    test('renders scroll container with proper classes', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const scrollContainer = container.querySelector(
        '.overflow-x-auto'
      );
      // Verify scroll container exists and has correct classes for scrolling
      expect(scrollContainer).toHaveClass('overflow-x-auto', 'pb-1', '-mx-1', 'px-1');
    });
  });

  describe('Multiple FilterRow instances', () => {
    // 複数フィルター行の配置：各セクション（リーグ・放送局・その他）が独立して表示
    test('renders multiple filter rows correctly', () => {
      render(
        <div>
          <FilterRow label="リーグ">
            <button>League 1</button>
          </FilterRow>
          <FilterRow label="放送局">
            <button>Broadcast 1</button>
          </FilterRow>
          <FilterRow label="その他">
            <button>Other 1</button>
          </FilterRow>
        </div>
      );
      expect(screen.getByText('リーグ')).toBeInTheDocument();
      expect(screen.getByText('放送局')).toBeInTheDocument();
      expect(screen.getByText('その他')).toBeInTheDocument();
      expect(screen.getByText('League 1')).toBeInTheDocument();
      expect(screen.getByText('Broadcast 1')).toBeInTheDocument();
      expect(screen.getByText('Other 1')).toBeInTheDocument();
    });

    // スペース調整：最後の行の下マージンなし（last:mb-0）で余白を詰める
    test('last FilterRow has no bottom margin', () => {
      const { container } = render(
        <div>
          <FilterRow label="First">
            <button>First</button>
          </FilterRow>
          <FilterRow label="Last">
            <button>Last</button>
          </FilterRow>
        </div>
      );
      const rows = container.querySelectorAll('[class*="mb-2"]');
      expect(rows.length).toBe(2);
    });
  });

  describe('Empty children', () => {
    // エッジケース：空Fragment を受け入れ、ラベルとコンテナは表示される
    test('renders with empty fragment children', () => {
      const { container } = render(
        <FilterRow label="Empty">
          <>
          </>
        </FilterRow>
      );
      expect(screen.getByText('Empty')).toBeInTheDocument();
      expect(container.querySelector('.overflow-x-auto')).toBeInTheDocument();
    });

    // エッジケース：null children を受け入れ（React.Children.toArray で安全に処理）
    test('renders with null children', () => {
      render(
        <FilterRow label="Null">
          {null}
        </FilterRow>
      );
      expect(screen.getByText('Null')).toBeInTheDocument();
    });

    // エッジケース：空配列 children を受け入れ
    test('renders with empty array children', () => {
      render(
        <FilterRow label="Empty">
          {[]}
        </FilterRow>
      );
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    // a11y：ラベルテキストがスクリーンリーダーで読める
    test('label is readable by screen readers', () => {
      const { container } = render(
        <FilterRow label="リーグ">
          <button>Test</button>
        </FilterRow>
      );
      expect(screen.getByText('リーグ')).toBeInTheDocument();
    });

    // a11y：children のボタンなどが role:button として認識可能
    test('children are accessible', () => {
      render(
        <FilterRow label="Buttons">
          <button>Accessible Button</button>
        </FilterRow>
      );
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
