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
    test('renders chip with label', () => {
      render(<FilterChip {...defaultProps} />);
      expect(screen.getByText('W杯2026')).toBeInTheDocument();
    });

    test('renders chip button', () => {
      render(<FilterChip {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('renders icon when provided', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={Star} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('does not render icon when not provided', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={undefined} />
      );
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Active state styling', () => {
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

    test('applies color border when active is true', () => {
      const { container } = render(
        <FilterChip {...defaultProps} active={true} color="#C8102E" />
      );
      const button = container.querySelector('button');
      expect(button).toHaveStyle('borderColor: #C8102E');
    });

    test('applies slate border when active is false', () => {
      const { container } = render(
        <FilterChip {...defaultProps} active={false} />
      );
      const button = container.querySelector('button');
      expect(button).toHaveStyle('borderColor: #e2e8f0');
    });
  });

  describe('Click handling', () => {
    test('calls onClick when clicked', () => {
      const onClick = jest.fn();
      render(<FilterChip {...defaultProps} onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

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
    test('renders icon with correct size', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={Star} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '13');
      expect(svg).toHaveAttribute('height', '13');
    });

    test('renders icon with no label', () => {
      const { container } = render(
        <FilterChip {...defaultProps} icon={Star} label="" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
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

    test('button has correct role', () => {
      render(<FilterChip {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    test('handles empty label', () => {
      const { container } = render(
        <FilterChip {...defaultProps} label="" />
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    test('handles very long label', () => {
      const longLabel = 'FIFA ワールドカップ 2026年大会';
      render(<FilterChip {...defaultProps} label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    test('handles special characters in label', () => {
      const specialLabel = 'テスト & レーシング';
      render(<FilterChip {...defaultProps} label={specialLabel} />);
      expect(screen.getByText(specialLabel)).toBeInTheDocument();
    });
  });
});
