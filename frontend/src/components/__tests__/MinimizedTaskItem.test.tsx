import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MinimizedTaskItem from '../MinimizedTaskItem';

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, {
      get: (_: unknown, tag: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ({ children, ...props }: any) => React.createElement(tag, props, children);
      },
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});

describe('MinimizedTaskItem', () => {
  const mockTask = {
    id: 1,
    job: 'Complete project documentation',
    priority: 'High',
    status: 'Pending',
    order: 0,
    place_of_work: 'Corporate Office',
  };

  it('should render task title and priority badge', () => {
    const mockOnClick = vi.fn();
    render(
      <MinimizedTaskItem task={mockTask} onClick={mockOnClick} />
    );

    expect(screen.getByText('Complete project documentation')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = vi.fn();
    const { container } = render(
      <MinimizedTaskItem task={mockTask} onClick={mockOnClick} />
    );

    const taskElement = container.firstChild;
    fireEvent.click(taskElement);
    expect(mockOnClick).toHaveBeenCalledWith(mockTask.id);
  });

  it('should display correct priority badge color for different priorities', () => {
    const { rerender } = render(
      <MinimizedTaskItem task={{ ...mockTask, priority: 'High' }} onClick={() => {}} />
    );
    let badge = screen.getByText('High');
    expect(badge).toHaveClass('bg-red-100', 'text-red-700');

    rerender(
      <MinimizedTaskItem task={{ ...mockTask, priority: 'Medium' }} onClick={() => {}} />
    );
    badge = screen.getByText('Medium');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');

    rerender(
      <MinimizedTaskItem task={{ ...mockTask, priority: 'Low' }} onClick={() => {}} />
    );
    badge = screen.getByText('Low');
    expect(badge).toHaveClass('bg-green-100', 'text-green-700');
  });
});
