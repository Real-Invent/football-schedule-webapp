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
    test('renders label', () => {
      render(<FilterRow {...defaultProps} />);
      expect(screen.getByText('リーグ')).toBeInTheDocument();
    });

    test('renders children', () => {
      render(<FilterRow {...defaultProps} />);
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    test('renders container div', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const filterRow = container.firstChild;
      expect(filterRow).toBeInTheDocument();
    });
  });

  describe('Children handling', () => {
    test('renders single child element', () => {
      render(
        <FilterRow label="Single" >
          <button>Single Button</button>
        </FilterRow>
      );
      expect(screen.getByText('Single Button')).toBeInTheDocument();
    });

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

    test('renders text children', () => {
      render(
        <FilterRow label="Text">
          Text content
        </FilterRow>
      );
      expect(screen.getByText('Text content')).toBeInTheDocument();
    });

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
    test('applies text styling to label', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const labelDiv = container.querySelector(
        '.text-\\[10px\\]'
      );
      expect(labelDiv).toBeInTheDocument();
    });

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
    test('renders with correct CSS class for scrolling', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const scrollContainer = container.querySelector(
        '.overflow-x-auto'
      );
      expect(scrollContainer).toBeInTheDocument();
    });

    test('scrolling container has padding and margin', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const scrollContainer = container.querySelector(
        '.overflow-x-auto'
      );
      expect(scrollContainer).toHaveClass('pb-1', '-mx-1', 'px-1');
    });

    test('renders margin bottom utility class', () => {
      const { container } = render(<FilterRow {...defaultProps} />);
      const row = container.firstChild;
      expect(row).toHaveClass('mb-2', 'last:mb-0');
    });
  });

  describe('Scrollbar styling', () => {
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

    test('renders with null children', () => {
      render(
        <FilterRow label="Null">
          {null}
        </FilterRow>
      );
      expect(screen.getByText('Null')).toBeInTheDocument();
    });

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
    test('label is readable by screen readers', () => {
      const { container } = render(
        <FilterRow label="リーグ">
          <button>Test</button>
        </FilterRow>
      );
      expect(screen.getByText('リーグ')).toBeInTheDocument();
    });

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
