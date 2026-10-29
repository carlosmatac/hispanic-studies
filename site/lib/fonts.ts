import { Ibarra_Real_Nova, Inter, IBM_Plex_Mono } from 'next/font/google';

/* The site's three faces (AGENTS.md), shared by the site's layout and the back office's. */
export const display = Ibarra_Real_Nova({
  subsets: ['latin'], weight: ['400', '600'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap',
});
export const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
export const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const fontVars = `${display.variable} ${body.variable} ${mono.variable}`;
