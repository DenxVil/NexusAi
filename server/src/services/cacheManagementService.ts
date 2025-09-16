// Created with love 🩶 by Denvil 🧑‍💻
// Cache Management Service

import config from '../config';

export class CacheManagementService {
  private static instance: CacheManagementService;
  private buildTimestamp: string;
  private version: string;

  private constructor() {
    this.buildTimestamp = process.env.BUILD_TIMESTAMP || Date.now().toString();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  public static getInstance(): CacheManagementService {
    if (!CacheManagementService.instance) {
      CacheManagementService.instance = new CacheManagementService();
    }
    return CacheManagementService.instance;
  }

  /**
   * Generate cache-busting parameters for static assets
   */
  public getCacheBustingParams(): string {
    return `v=${this.version}&t=${this.buildTimestamp}`;
  }

  /**
   * Get versioned URL for static assets
   */
  public getVersionedUrl(path: string): string {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}${this.getCacheBustingParams()}`;
  }

  /**
   * Get cache headers for different types of content
   */
  public getCacheHeaders(contentType: 'static' | 'api' | 'html'): Record<string, string> {
    switch (contentType) {
      case 'static':
        return {
          'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
          'ETag': `"${this.buildTimestamp}"`,
          'Last-Modified': new Date().toUTCString(),
          'Vary': 'Accept-Encoding'
        };
      
      case 'api':
        return {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
      
      case 'html':
        return {
          'Cache-Control': 'no-cache, must-revalidate',
          'ETag': `"${this.buildTimestamp}"`,
          'Last-Modified': new Date().toUTCString()
        };
      
      default:
        return {
          'Cache-Control': 'no-cache'
        };
    }
  }

  /**
   * Generate service worker cache invalidation
   */
  public generateServiceWorkerCache(): string {
    return `
// Auto-generated cache configuration
const CACHE_NAME = 'nexus-ai-v${this.version}-${this.buildTimestamp}';
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/main.${this.buildTimestamp}.js',
  '/static/css/main.${this.buildTimestamp}.css',
  '/manifest.json',
  '/favicon.ico'
];

// Clear old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('nexus-ai-') && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Cache strategy
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    // Network first for API calls
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline', { status: 503 });
      })
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
`;
  }

  /**
   * Get build information for health checks
   */
  public getBuildInfo(): {
    version: string;
    buildTimestamp: string;
    environment: string;
    cacheStrategy: string;
  } {
    return {
      version: this.version,
      buildTimestamp: this.buildTimestamp,
      environment: config.nodeEnv,
      cacheStrategy: 'versioned-assets'
    };
  }

  /**
   * Generate HTML meta tags for cache control
   */
  public generateCacheMetaTags(): string {
    return `
  <meta http-equiv="Cache-Control" content="no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="build-version" content="${this.version}">
  <meta name="build-timestamp" content="${this.buildTimestamp}">
  <meta name="cache-strategy" content="versioned-assets">
`;
  }

  /**
   * Check if client cache is valid
   */
  public isClientCacheValid(clientVersion?: string, clientTimestamp?: string): boolean {
    if (!clientVersion || !clientTimestamp) {
      return false;
    }
    
    return clientVersion === this.version && clientTimestamp === this.buildTimestamp;
  }

  /**
   * Generate CDN cache invalidation paths
   */
  public getCdnInvalidationPaths(): string[] {
    return [
      '/',
      '/index.html',
      '/static/*',
      '/manifest.json',
      '/service-worker.js'
    ];
  }

  /**
   * Generate cache headers middleware
   */
  public getCacheHeadersMiddleware() {
    return (req: any, res: any, next: any) => {
      const path = req.path;
      
      if (path.startsWith('/static/') || path.includes('.')) {
        // Static assets
        const headers = this.getCacheHeaders('static');
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      } else if (path.startsWith('/api/')) {
        // API endpoints
        const headers = this.getCacheHeaders('api');
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      } else {
        // HTML pages
        const headers = this.getCacheHeaders('html');
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      next();
    };
  }
}

export default CacheManagementService;