import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExplodedBike } from './ExplodedBike';
import { PART_LIST } from './parts';

const part = (name: string) => screen.getByRole('button', { name: new RegExp('^' + name + ',') });
const card = () => screen.getByRole('status');

describe('ExplodedBike', () => {
  it('offers every part as a button named with its system, with one tab stop', () => {
    render(<ExplodedBike progress={0} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(PART_LIST.length);
    expect(part('Saddle')).toHaveAccessibleName('Saddle, Contact points');
    expect(buttons.filter((b) => b.getAttribute('tabindex') === '0')).toHaveLength(1);
  });

  it('shows the info card for a clicked part, with its fit note and sources, and highlights it', async () => {
    const onSelect = vi.fn();
    render(<ExplodedBike progress={0} onSelect={onSelect} />);
    await userEvent.click(part('Pedals'));
    const c = within(card());
    expect(c.getByRole('heading', { name: 'Pedals' })).toBeInTheDocument();
    expect(c.getByText('Contact points')).toBeInTheDocument();
    expect(c.getByText(/at least 10 mm behind the ball of the foot/)).toBeInTheDocument();
    expect(c.getByRole('link', { name: /Cyclefit/ })).toHaveAttribute('href', 'https://www.cyclefit.co.uk/journal/how-to-fit-cycling-cleats-correctly');
    expect(part('Pedals').closest('.bx-part')).toHaveClass('is-active');
    expect(onSelect).toHaveBeenLastCalledWith('pedals');
  });

  it('clears the selection when the same part is clicked again, or on Escape', async () => {
    render(<ExplodedBike progress={0} />);
    await userEvent.click(part('Chain'));
    expect(card()).toHaveTextContent('Chain');
    await userEvent.click(part('Chain'));
    expect(card()).toBeEmptyDOMElement();
    await userEvent.click(part('Stem'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(card()).toBeEmptyDOMElement();
  });

  it('moves between parts with the arrow keys, Home and End', async () => {
    render(<ExplodedBike progress={0} />);
    await userEvent.tab();
    const first = part(PART_LIST[0].name);
    expect(document.activeElement).toBe(first);
    expect(card()).toHaveTextContent(PART_LIST[0].name);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(part(PART_LIST[1].name));
    expect(part(PART_LIST[1].name)).toHaveAttribute('tabindex', '0');
    expect(first).toHaveAttribute('tabindex', '-1');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(document.activeElement).toBe(part(PART_LIST[PART_LIST.length - 1].name));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(first);
    await userEvent.keyboard('{End}');
    expect(card()).toHaveTextContent(PART_LIST[PART_LIST.length - 1].name);
  });

  it('previews on hover with a mouse, and clears when the pointer leaves', () => {
    render(<ExplodedBike progress={0} />);
    fireEvent.pointerOver(part('Fork'), { pointerType: 'mouse' });
    expect(card()).toHaveTextContent('Fork');
    fireEvent.pointerLeave(part('Fork').closest('svg')!, { pointerType: 'mouse' });
    expect(card()).toBeEmptyDOMElement();
  });

  it('moves parts apart along their own vectors as progress rises', () => {
    const { rerender, container } = render(<ExplodedBike progress={0} />);
    const saddle = () => container.querySelector('[data-frag="saddle"]')!;
    const frame = () => container.querySelector('[data-frag="toptube"]')!;
    expect(saddle()).not.toHaveAttribute('transform');
    rerender(<ExplodedBike progress={1} />);
    expect(saddle()).toHaveAttribute('transform', 'translate(-100 -350)');
    expect(frame()).not.toHaveAttribute('transform');
  });

  it('is a plain picture when not interactive', () => {
    render(<ExplodedBike progress={0} interactive={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /road bike/i })).toBeInTheDocument();
  });
});
