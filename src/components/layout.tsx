import Box, { type BoxProps } from '@mui/material/Box';
import Typography, { type TypographyProps } from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** Content column: up to --max wide with 16 px gutters. */
export function Wrap({ sx, ...props }: BoxProps) {
  return <Box {...props} sx={[{ width: 'min(var(--max), 100% - 2 * var(--gutter))', mx: 'auto' }, ...(Array.isArray(sx) ? sx : [sx])]} />;
}

/** The eyebrow chip that names the feature, in the current tool's tone. */
export function Eyebrow({ icon, children, ...props }: { icon?: IconName; children: ReactNode } & TypographyProps) {
  return (
    <Typography
      component="p"
      {...props}
      sx={[{
        display: 'inline-flex', alignItems: 'center', gap: '6px', p: '4px 10px', borderRadius: '8px', m: '0 0 20px',
        background: 'var(--tone-tint)', color: 'var(--tone)', fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.4,
        '& .ico': { width: 16, height: 16 },
      }, ...(Array.isArray(props.sx) ? props.sx : [props.sx])]}
    >
      {icon && <Icon name={icon} />}
      {children}
    </Typography>
  );
}

/** Section label, title and dek: left-aligned below the hero. */
export function SectionHead({ label, title, id, children }: { label: string; title: string; id: string; children?: ReactNode }) {
  return (
    <Box component="header" sx={{ mb: '40px' }}>
      <Typography component="p" sx={{ m: 0, fontSize: 15, fontWeight: 600, color: 'var(--tone)' }}>{label}</Typography>
      <Typography variant="h2" id={id} sx={{ mt: 1, mb: 0 }}>{title}</Typography>
      {children && <Typography component="p" sx={{ mt: 2, mb: 0, fontSize: 19, color: 'var(--ink-2)', maxWidth: '34em' }}>{children}</Typography>}
    </Box>
  );
}
