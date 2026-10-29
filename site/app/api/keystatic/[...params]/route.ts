import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '../../../../keystatic.config';

/* The CMS's API: reads and writes the archive's files (locally) or talks to
   GitHub (on the deployed site). See docs/cms.md. */
export const { POST, GET } = makeRouteHandler({ config });
