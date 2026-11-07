import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import { Icon } from './Icon';

/** Light/dark toggle. Follows the device until the visitor chooses. */
export function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const current = (mode === 'system' ? systemMode : mode) ?? 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;
  return (
    <IconButton aria-label={label} title={label} onClick={() => setMode(next)} sx={{ '& .ico': { width: 18, height: 18 } }}>
      <Icon name={current === 'dark' ? 'sun' : 'moon'} />
    </IconButton>
  );
}
