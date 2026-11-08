import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Segmented } from './Segmented';

function Harness() {
  const [v, setV] = useState<'a' | 'b' | 'c'>('a');
  return (
    <>
      <span id="lbl">Pick one</span>
      <Segmented labelledBy="lbl" value={v} onChange={setV} options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }]} />
    </>
  );
}

describe('Segmented', () => {
  it('is a named radio group whose thumb slides to the picked option, by click or arrow key', async () => {
    render(<Harness />);
    const thumb = screen.getByTestId('segmented-thumb');
    expect(screen.getByRole('radiogroup', { name: 'Pick one' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked();
    expect(thumb).toHaveStyle({ transform: 'translateX(0%)' });
    await userEvent.click(screen.getByRole('radio', { name: 'Gamma' }));
    expect(thumb).toHaveStyle({ transform: 'translateX(200%)' });
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked();
    expect(thumb).toHaveStyle({ transform: 'translateX(100%)' });
  });
});
