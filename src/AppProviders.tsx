import type { ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { MODE_STORAGE_KEY, theme } from './theme/theme';
import { WorkstandTokens } from './theme/WorkstandTokens';

/** Theme, baseline and Workstand tokens. Follows the device setting until the visitor toggles it. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme} defaultMode="system" modeStorageKey={MODE_STORAGE_KEY} disableTransitionOnChange>
      <CssBaseline />
      <WorkstandTokens />
      {children}
    </ThemeProvider>
  );
}
