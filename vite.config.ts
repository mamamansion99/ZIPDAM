import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Runs the Vercel functions in `api/` during `vite dev`, so local development
 * hits the same catalog/order endpoints as production instead of nothing.
 */
const apiDevServer = () => ({
  name: 'zipdam-api-dev-server',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith('/api/')) return next();

      const name = url.pathname.slice('/api/'.length).replace(/[^a-z0-9-]/gi, '');
      const file = path.resolve(__dirname, 'api', `${name}.js`);
      if (!fs.existsSync(file)) return next();

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const raw = Buffer.concat(chunks).toString('utf8');
      req.body = raw ? JSON.parse(raw) : {};

      const shim = {
        statusCode: 200,
        status(code: number) { this.statusCode = code; return this; },
        setHeader(key: string, value: string) { res.setHeader(key, value); return this; },
        json(payload: unknown) {
          res.statusCode = this.statusCode;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(payload));
        },
        send(payload: string) {
          res.statusCode = this.statusCode;
          res.end(payload);
        },
      };

      try {
        const mod = await server.ssrLoadModule(file);
        await mod.default(req, shim);
      } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: String(err) }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), apiDevServer()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
