import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  // Copy 404.html
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtml);

  // Common SPA routes to generate static fallbacks for
  const routes = [
    'dashboard',
    'auctions',
    'activity',
    'login',
    'register',
    'rfqs',
    'rfqs/new',
    'rfqs/1',
    'rfqs/2',
    'rfqs/3',
    'rfqs/4',
    'rfqs/5',
    'rfqs/6',
    'rfqs/7',
    'rfqs/8',
    'rfqs/9',
    'rfqs/10'
  ];

  for (const route of routes) {
    const routeDir = path.join(distDir, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml);
  }

  console.log(`Generated static entrypoints for ${routes.length} SPA routes.`);
} else {
  console.warn('dist/index.html not found, skipping route generation.');
}
