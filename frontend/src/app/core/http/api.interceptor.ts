import { HttpInterceptorFn } from '@angular/common/http';

const configuredBase = (import.meta.env.VITE_API_BASE ?? '').trim();

let localDevBase = '';
if (typeof window !== 'undefined') {
  const port = window.location.port;
  const host = window.location.hostname;
  const loopbackHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  if (port === '4200' && loopbackHosts.has(host)) {
    localDevBase = 'http://localhost:3000/api';
  }
}

const resolvedBase = configuredBase || localDevBase;

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http')) {
    return next(req);
  }

  const target = resolvedBase
    ? normalizeToBase(resolvedBase, req.url)
    : buildRelativeUrl(req.url);

  return next(req.clone({ url: target }));
};

function normalizeToBase(base: string, path: string): string {
  const sanitizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const sanitizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${sanitizedBase}/${sanitizedPath}`;
}

function buildRelativeUrl(path: string): string {
  const sanitizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `/api/${sanitizedPath}`;
}
