import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortableContext } from '@dnd-kit/sortable';
import ExpandedTaskItem from '../ExpandedTaskItem';

vi.mock('../AIAssistButton', () => ({
  default: () => <div data-testid="ai-assist-button" />,
}));

describe('ExpandedTaskItem', () => {
  const mockTask = {
    id: 1,
    job: 'Complete project documentation',
    priority: 'High' as const,
    status: 'Pending',
    order: 0,
    place_of_work: 'Corporate Office',
    action_plan: 'Write docs and review',
  };

  it('should render all task form fields', () => {
    const mockOnUpdate = vi.fn();
    const mockOnRemove = vi.fn();
    render(
      <SortableContext items={[mockTask.id]}>
        <ExpandedTaskItem
          task={mockTask}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      </SortableContext>
    );

    expect(screen.getByDisplayValue('Complete project documentation')).toBeInTheDocument();
    // Select shows the value, not the text "High Priority"
    const prioritySelects = screen.getAllByRole('combobox');
    expect(prioritySelects[0]).toHaveValue('High');
    expect(prioritySelects[1]).toHaveValue('Pending');
    expect(screen.getByDisplayValue('Write docs and review')).toBeInTheDocument();
  });

  it('should call onUpdate when job input changes', () => {
    const mockOnUpdate = vi.fn();
    const mockOnRemove = vi.fn();

    render(
      <SortableContext items={[mockTask.id]}>
        <ExpandedTaskItem
          task={mockTask}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      </SortableContext>
    );

    const jobInput = screen.getByDisplayValue('Complete project documentation') as HTMLInputElement;
    fireEvent.change(jobInput, { target: { value: 'New task' } });

    // onUpdate should be called with the new value
    expect(mockOnUpdate).toHaveBeenCalledWith(1, { field: 'job', value: 'New task' });
  });

  it('should call onRemove when delete button is clicked', () => {
    const mockOnUpdate = vi.fn();
    const mockOnRemove = vi.fn();
    const { container } = render(
      <SortableContext items={[mockTask.id]}>
        <ExpandedTaskItem
          task={mockTask}
          onUpdate={mockOnUpdate}
          onRemove={mockOnRemove}
        />
      </SortableContext>
    );

    const deleteButton = container.querySelector('[data-testid="delete-button"]');
    fireEvent.click(deleteButton!);
    expect(mockOnRemove).toHaveBeenCalledWith(1);
  });

  it('should call onUpdate when place_of_work select changes', async () => {
    const mockOnUpdate = vi.fn();
    const mockOnRemove = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <SortableContext items={[mockTask.id]}>
        <ExpandedTaskItem task={mockTask} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />
      </SortableContext>
    );

    const selects = container.querySelectorAll('select');
    const placeSelect = selects[2]; // Third select is place_of_work
    await user.selectOptions(placeSelect, 'Work From Home');
    expect(mockOnUpdate).toHaveBeenCalledWith(1, { field: 'place_of_work', value: 'Work From Home' });
  });
});
