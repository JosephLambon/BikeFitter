import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExplodedBike, PartLabel } from './ExplodedBike';
import { DEFAULT_BUILD } from './build';
import { partsFor } from './parts';

const PART_LIST = partsFor();

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

  it('the part label puts fresh words in its live region each time a part is picked, even the same part again', () => {
    const { rerender } = render(<PartLabel partKey="saddle" />);
    const first = screen.getByRole('heading', { name: 'Saddle' });
    rerender(<PartLabel partKey={null} />);
    rerender(<PartLabel partKey="saddle" />);
    const again = screen.getByRole('heading', { name: 'Saddle' });
    expect(again).not.toBe(first); // new nodes, so screen readers announce it again
    rerender(<PartLabel partKey="saddle" />);
    expect(screen.getByRole('heading', { name: 'Saddle' })).toBe(again); // but not on every render
  });

  describe('with the part label', () => {
    const label = () => screen.getByTestId('part-label');
    const win = () => screen.getByTestId('part-label-window');
    it('names the selected part in a window above the drawing, with only its name and what it is, and floats no card', async () => {
      const { container } = render(<ExplodedBike progress={0} label />);
      expect(win()).toHaveAttribute('data-shown', 'false');
      expect(win()).toHaveAttribute('aria-hidden', 'true');
      expect(win()).toBeEmptyDOMElement();
      expect(label().compareDocumentPosition(container.querySelector('.bx-stage')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await userEvent.click(part('Pedals'));
      expect(label()).toHaveAttribute('role', 'status');
      expect(win()).toHaveAttribute('data-shown', 'true');
      expect(win()).not.toHaveAttribute('aria-hidden');
      expect(within(label()).getByRole('heading', { name: 'Pedals' })).toBeInTheDocument();
      expect(label()).toHaveTextContent('Clipless road pedals that lock onto cleats on your shoes.');
      expect(label()).not.toHaveTextContent(/Contact points|10 mm behind/);
      expect(container.querySelector('.bx-card')).toBeNull();
    });

    it('swaps the words on hover, and hides the window when the pointer leaves, keeping its words while it fades', () => {
      render(<ExplodedBike progress={0} label />);
      fireEvent.pointerOver(part('Fork'), { pointerType: 'mouse' });
      expect(label()).toHaveTextContent('Fork');
      fireEvent.pointerOver(part('Saddle'), { pointerType: 'mouse' });
      expect(label()).toHaveTextContent('SaddleWhere you sit');
      fireEvent.pointerLeave(part('Saddle').closest('svg')!, { pointerType: 'mouse' });
      expect(win()).toHaveAttribute('data-shown', 'false');
      expect(win()).toHaveAttribute('aria-hidden', 'true');
      expect(win()).toHaveTextContent('Saddle');
    });

    it('stays shown after a click when the pointer leaves, until the part is clicked again', async () => {
      render(<ExplodedBike progress={0} label />);
      await userEvent.click(part('Stem'));
      fireEvent.pointerLeave(part('Stem').closest('svg')!, { pointerType: 'mouse' });
      expect(win()).toHaveAttribute('data-shown', 'true');
      await userEvent.click(part('Stem'));
      expect(win()).toHaveAttribute('data-shown', 'false');
    });

    it('docks the full card instead when there is a card host (phones)', async () => {
      const host = document.createElement('div');
      document.body.append(host);
      render(<ExplodedBike progress={0} label cardHost={host} />);
      expect(screen.queryByTestId('part-label')).not.toBeInTheDocument();
      await userEvent.click(part('Pedals'));
      expect(within(host).getByText('Contact points')).toBeInTheDocument();
      host.remove();
    });
  });

  it('moves parts apart along their own vectors as progress rises', () => {
    const { rerender, container } = render(<ExplodedBike progress={0} />);
    const saddle = () => container.querySelector('[data-frag="saddle"]')!;
    const frame = () => container.querySelector('[data-frag="toptube"]')!;
    expect(saddle()).not.toHaveAttribute('style');
    rerender(<ExplodedBike progress={1} />);
    expect(saddle()).toHaveStyle({ transform: 'translate(-100px, -350px)' });
    expect(frame()).not.toHaveAttribute('style');
  });

  it('is a plain picture when not interactive', () => {
    render(<ExplodedBike progress={0} interactive={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /road bike/i })).toBeInTheDocument();
  });

  describe('with a build', () => {
    it('draws only the parts the build has, each one a button', () => {
      const b = { ...DEFAULT_BUILD, brakes: 'rim' as const };
      const { container } = render(<ExplodedBike progress={0} build={b} />);
      expect(screen.getAllByRole('button')).toHaveLength(partsFor(b).length);
      expect(part('Rim brake calliper')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Rotor/ })).not.toBeInTheDocument();
      expect(container.querySelector('[data-frag="rotor-f"]')).not.toBeInTheDocument();
    });

    it('swaps parts when the build changes, and clears a selection that left the bike', async () => {
      const onSelect = vi.fn();
      const { rerender, container } = render(<ExplodedBike progress={0} build={DEFAULT_BUILD} onSelect={onSelect} />);
      await userEvent.click(part('Front mech'));
      expect(card()).toHaveTextContent('Front mech');
      rerender(<ExplodedBike progress={0} build={{ ...DEFAULT_BUILD, chainrings: 'single' }} onSelect={onSelect} />);
      expect(card()).toBeEmptyDOMElement();
      expect(onSelect).toHaveBeenLastCalledWith(null);
      expect(container.querySelector('[data-frag="frontmech"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-frag="smallring"]')).not.toBeInTheDocument();
    });

    it('keeps a selection that is still on the bike, with copy for the new build', async () => {
      const { rerender } = render(<ExplodedBike progress={0} build={DEFAULT_BUILD} />);
      await userEvent.click(part('Brake and gear levers'));
      expect(card()).not.toHaveTextContent('signal');
      rerender(<ExplodedBike progress={0} build={{ ...DEFAULT_BUILD, gears: 'electronic' }} />);
      expect(card()).toHaveTextContent('Brake and gear levers');
      expect(card()).toHaveTextContent('signal');
    });

    it('redraws the rims deeper for deep-section rims', () => {
      const { rerender, container } = render(<ExplodedBike progress={0} build={DEFAULT_BUILD} />);
      const rim = () => container.querySelector('[data-frag="rim-f"] .bx-lift')!.innerHTML;
      const shallow = rim();
      rerender(<ExplodedBike progress={0} build={{ ...DEFAULT_BUILD, rims: 'deep' }} />);
      expect(rim()).not.toBe(shallow);
    });

    describe('when the browser can animate', () => {
      let finish: (() => void)[];
      beforeEach(() => {
        finish = [];
        Element.prototype.animate = vi.fn(function () {
          let done!: () => void;
          const finished = new Promise<void>((r) => { done = r; });
          finish.push(done);
          return { finished, cancel: () => {} } as unknown as Animation;
        });
        Element.prototype.getAnimations = () => [];
      });
      afterEach(() => {
        delete (Element.prototype as Partial<Element>).animate;
        delete (Element.prototype as Partial<Element>).getAnimations;
      });

      it('keeps leaving parts drawn, but not selectable, until they have gone', async () => {
        const { rerender, container } = render(<ExplodedBike progress={0} build={DEFAULT_BUILD} />);
        rerender(<ExplodedBike progress={0} build={{ ...DEFAULT_BUILD, brakes: 'rim' }} />);
        const rotor = () => container.querySelector('[data-frag="rotor-f"]');
        expect(rotor()).toHaveClass('is-leaving');
        expect(rotor()).not.toHaveAttribute('role');
        expect(part('Rim brake calliper')).toBeInTheDocument();
        await act(async () => { finish.forEach((f) => f()); });
        expect(rotor()).not.toBeInTheDocument();
      });

      it('rings out a signal from the lever and mechs when the gears go electronic', () => {
        const { rerender, container } = render(<ExplodedBike progress={0} build={DEFAULT_BUILD} />);
        expect(container.querySelector('.bx-pulse')).not.toBeInTheDocument();
        rerender(<ExplodedBike progress={0} build={{ ...DEFAULT_BUILD, gears: 'electronic' }} />);
        expect(container.querySelectorAll('.bx-pulse')).toHaveLength(3);
      });
    });
  });
});
