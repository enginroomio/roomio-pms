import { flattenSidebarLinks } from '../lib/navigation/sidebar-nav.ts';
import { writeFileSync } from 'node:fs';

const links = flattenSidebarLinks();
writeFileSync('/tmp/sidebar-links.json', JSON.stringify(links, null, 2));
console.log('total', links.length);
const uniqueHrefs = [...new Set(links.map(l => l.href))];
console.log('unique hrefs', uniqueHrefs.length);
const uniqueBasePaths = [...new Set(links.map(l => l.href.split('?')[0]))];
console.log('unique base paths', uniqueBasePaths.length);
writeFileSync('/tmp/unique-base-paths.json', JSON.stringify(uniqueBasePaths.sort(), null, 2));
