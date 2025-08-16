(() => {
  let e, t, s;
  var a = {
      136: () => {
        try {
          self['workbox:core:7.2.0'] && _();
        } catch (e) {}
      },
      227: () => {
        try {
          self['workbox:routing:7.2.0'] && _();
        } catch (e) {}
      },
      390: () => {
        try {
          self['workbox:strategies:7.2.0'] && _();
        } catch (e) {}
      },
      447: () => {
        try {
          self['workbox:precaching:7.2.0'] && _();
        } catch (e) {}
      },
    },
    i = {};
  function r(e) {
    var t = i[e];
    if (void 0 !== t) return t.exports;
    var s = (i[e] = { exports: {} }),
      n = !0;
    try {
      a[e](s, s.exports, r), (n = !1);
    } finally {
      n && delete i[e];
    }
    return s.exports;
  }
  r(136);
  class n extends Error {
    constructor(e, t) {
      super(
        ((e, ...t) => {
          let s = e;
          return t.length > 0 && (s += ` :: ${JSON.stringify(t)}`), s;
        })(e, t)
      ),
        (this.name = e),
        (this.details = t);
    }
  }
  const l = {
      googleAnalytics: 'googleAnalytics',
      precache: 'precache-v2',
      prefix: 'workbox',
      runtime: 'runtime',
      suffix: typeof registration != 'undefined' ? registration.scope : '',
    },
    c = (e) =>
      [l.prefix, e, l.suffix].filter((e) => e && e.length > 0).join('-'),
    h = {
      getPrecacheName: (e) => e || c(l.precache),
      getRuntimeName: (e) => e || c(l.runtime),
    };
  function o(e, t) {
    const s = t();
    return e.waitUntil(s), s;
  }
  r(447);
  class u {
    constructor() {
      (this.updatedURLs = []),
        (this.notUpdatedURLs = []),
        (this.handlerWillStart = async ({ request: e, state: t }) => {
          t && (t.originalRequest = e);
        }),
        (this.cachedResponseWillBeUsed = async ({
          event: e,
          state: t,
          cachedResponse: s,
        }) => {
          if (
            e.type === 'install' &&
            t &&
            t.originalRequest &&
            t.originalRequest instanceof Request
          ) {
            const e = t.originalRequest.url;
            s ? this.notUpdatedURLs.push(e) : this.updatedURLs.push(e);
          }
          return s;
        });
    }
  }
  class d {
    constructor({ precacheController: e }) {
      (this.cacheKeyWillBeUsed = async ({ request: e, params: t }) => {
        const s =
          (t == null ? void 0 : t.cacheKey) ||
          this._precacheController.getCacheKeyForURL(e.url);
        return s ? new Request(s, { headers: e.headers }) : e;
      }),
        (this._precacheController = e);
    }
  }
  async function f(t, s) {
    let a = null;
    if ((t.url && (a = new URL(t.url).origin), a !== self.location.origin))
      throw new n('cross-origin-copy-response', { origin: a });
    const i = t.clone(),
      r = {
        headers: new Headers(i.headers),
        status: i.status,
        statusText: i.statusText,
      },
      l = s ? s(r) : r,
      c = (() => {
        if (void 0 === e) {
          const t = new Response('');
          if ('body' in t)
            try {
              new Response(t.body), (e = !0);
            } catch (t) {
              e = !1;
            }
          e = !1;
        }
        return e;
      })()
        ? i.body
        : await i.blob();
    return new Response(c, l);
  }
  function p(e, t) {
    const s = new URL(e);
    for (const e of t) s.searchParams.delete(e);
    return s.href;
  }
  async function g(e, t, s, a) {
    const i = p(t.url, s);
    if (t.url === i) return e.match(t, a);
    const r = { ...a, ignoreSearch: !0 };
    for (const n of await e.keys(t, r))
      if (i === p(n.url, s)) return e.match(n, a);
  }
  class w {
    constructor() {
      this.promise = new Promise((e, t) => {
        (this.resolve = e), (this.reject = t);
      });
    }
  }
  const y = new Set();
  async function m() {
    for (const e of y) await e();
  }
  function R(e) {
    returntypeof;
    e == 'string' ? new Request(e) : e;
  }
  r(390);
  class C {
    constructor(e, t) {
      for (const s of ((this._cacheKeys = {}),
      Object.assign(this, t),
      (this.event = t.event),
      (this._strategy = e),
      (this._handlerDeferred = new w()),
      (this._extendLifetimePromises = []),
      (this._plugins = [...e.plugins]),
      (this._pluginStateMap = new Map()),
      this._plugins))
        this._pluginStateMap.set(s, {});
      this.event.waitUntil(this._handlerDeferred.promise);
    }
    async fetch(e) {
      let { event: t } = this,
        s = R(e);
      if (
        s.mode === 'navigate' &&
        t instanceof FetchEvent &&
        t.preloadResponse
      ) {
        const e = await t.preloadResponse;
        if (e) return e;
      }
      const a = this.hasCallback('fetchDidFail') ? s.clone() : null;
      try {
        for (const e of this.iterateCallbacks('requestWillFetch'))
          s = await e({ request: s.clone(), event: t });
      } catch (e) {
        if (e instanceof Error)
          throw new n('plugin-error-request-will-fetch', {
            thrownErrorMessage: e.message,
          });
      }
      const i = s.clone();
      try {
        let e;
        for (const a of ((e = await fetch(
          s,
          s.mode === 'navigate' ? void 0 : this._strategy.fetchOptions
        )),
        this.iterateCallbacks('fetchDidSucceed')))
          e = await a({ event: t, request: i, response: e });
        return e;
      } catch (e) {
        throw (
          (a &&
            (await this.runCallbacks('fetchDidFail', {
              error: e,
              event: t,
              originalRequest: a.clone(),
              request: i.clone(),
            })),
          e)
        );
      }
    }
    async fetchAndCachePut(e) {
      const t = await this.fetch(e),
        s = t.clone();
      return this.waitUntil(this.cachePut(e, s)), t;
    }
    async cacheMatch(e) {
      let t,
        s = R(e),
        { cacheName: a, matchOptions: i } = this._strategy,
        r = await this.getCacheKey(s, 'read'),
        n = { ...i, cacheName: a };
      for (const e of ((t = await caches.match(r, n)),
      this.iterateCallbacks('cachedResponseWillBeUsed')))
        t =
          (await e({
            cacheName: a,
            matchOptions: i,
            cachedResponse: t,
            request: r,
            event: this.event,
          })) || void 0;
      return t;
    }
    async cachePut(e, t) {
      const s = R(e);
      await new Promise((e) => setTimeout(e, 0));
      const a = await this.getCacheKey(s, 'write');
      if (!t)
        throw new n('cache-put-with-no-response', {
          url: new URL(String(a.url), location.href).href.replace(
            RegExp(`^${location.origin}`),
            ''
          ),
        });
      const i = await this._ensureResponseSafeToCache(t);
      if (!i) return !1;
      const { cacheName: r, matchOptions: l } = this._strategy,
        c = await self.caches.open(r),
        h = this.hasCallback('cacheDidUpdate'),
        o = h ? await g(c, a.clone(), ['__WB_REVISION__'], l) : null;
      try {
        await c.put(a, h ? i.clone() : i);
      } catch (e) {
        if (e instanceof Error)
          throwe.name === 'QuotaExceededError' && (await m()), e;
      }
      for (const e of this.iterateCallbacks('cacheDidUpdate'))
        await e({
          cacheName: r,
          oldResponse: o,
          newResponse: i.clone(),
          request: a,
          event: this.event,
        });
      return !0;
    }
    async getCacheKey(e, t) {
      const s = `${e.url} | ${t}`;
      if (!this._cacheKeys[s]) {
        let a = e;
        for (const e of this.iterateCallbacks('cacheKeyWillBeUsed'))
          a = R(
            await e({
              mode: t,
              request: a,
              event: this.event,
              params: this.params,
            })
          );
        this._cacheKeys[s] = a;
      }
      return this._cacheKeys[s];
    }
    hasCallback(e) {
      for (const t of this._strategy.plugins) if (e in t) return !0;
      return !1;
    }
    async runCallbacks(e, t) {
      for (const s of this.iterateCallbacks(e)) await s(t);
    }
    *iterateCallbacks(e) {
      for (const t of this._strategy.plugins)
        if (typeof t[e] == 'function') {
          const s = this._pluginStateMap.get(t),
            a = (a) => {
              const i = { ...a, state: s };
              return t[e](i);
            };
          yield a;
        }
    }
    waitUntil(e) {
      return this._extendLifetimePromises.push(e), e;
    }
    async doneWaiting() {
      let e;
      while ((e = this._extendLifetimePromises.shift())) await e;
    }
    destroy() {
      this._handlerDeferred.resolve(null);
    }
    async _ensureResponseSafeToCache(e) {
      let t = e,
        s = !1;
      for (const e of this.iterateCallbacks('cacheWillUpdate'))
        if (
          ((t =
            (await e({
              request: this.request,
              response: t,
              event: this.event,
            })) || void 0),
          (s = !0),
          !t)
        )
          break;
      return !s && t && t.status !== 200 && (t = void 0), t;
    }
  }
  class v {
    constructor(e = {}) {
      (this.cacheName = h.getRuntimeName(e.cacheName)),
        (this.plugins = e.plugins || []),
        (this.fetchOptions = e.fetchOptions),
        (this.matchOptions = e.matchOptions);
    }
    handle(e) {
      const [t] = this.handleAll(e);
      return t;
    }
    handleAll(e) {
      e instanceof FetchEvent && (e = { event: e, request: e.request });
      const t = e.event,
        s = typeof e.request == 'string' ? new Request(e.request) : e.request,
        a = new C(this, {
          event: t,
          request: s,
          params: 'params' in e ? e.params : void 0,
        }),
        i = this._getResponse(a, s, t),
        r = this._awaitComplete(i, a, s, t);
      return [i, r];
    }
    async _getResponse(e, t, s) {
      let a;
      await e.runCallbacks('handlerWillStart', { event: s, request: t });
      try {
        if (!(a = await this._handle(t, e)) || a.type === 'error')
          throw new n('no-response', { url: t.url });
      } catch (i) {
        if (i instanceof Error) {
          for (const r of e.iterateCallbacks('handlerDidError'))
            if ((a = await r({ error: i, event: s, request: t }))) break;
        }
        if (a);
        else throw i;
      }
      for (const i of e.iterateCallbacks('handlerWillRespond'))
        a = await i({ event: s, request: t, response: a });
      return a;
    }
    async _awaitComplete(e, t, s, a) {
      let i, r;
      try {
        i = await e;
      } catch (e) {}
      try {
        await t.runCallbacks('handlerDidRespond', {
          event: a,
          request: s,
          response: i,
        }),
          await t.doneWaiting();
      } catch (e) {
        e instanceof Error && (r = e);
      }
      if (
        (await t.runCallbacks('handlerDidComplete', {
          event: a,
          request: s,
          response: i,
          error: r,
        }),
        t.destroy(),
        r)
      )
        throw r;
    }
  }
  class b extends v {
    constructor(e = {}) {
      (e.cacheName = h.getPrecacheName(e.cacheName)),
        super(e),
        (this._fallbackToNetwork = !1 !== e.fallbackToNetwork),
        this.plugins.push(b.copyRedirectedCacheableResponsesPlugin);
    }
    async _handle(e, t) {
      const s = await t.cacheMatch(e);
      return (
        s ||
        (t.event && t.event.type === 'install'
          ? await this._handleInstall(e, t)
          : await this._handleFetch(e, t))
      );
    }
    async _handleFetch(e, t) {
      let s,
        a = t.params || {};
      if (this._fallbackToNetwork) {
        const i = a.integrity,
          r = e.integrity,
          n = !r || r === i;
        (s = await t.fetch(
          new Request(e, { integrity: e.mode !== 'no-cors' ? r || i : void 0 })
        )),
          i &&
            n &&
            e.mode !== 'no-cors' &&
            (this._useDefaultCacheabilityPluginIfNeeded(),
            await t.cachePut(e, s.clone()));
      } else
        throw new n('missing-precache-entry', {
          cacheName: this.cacheName,
          url: e.url,
        });
      return s;
    }
    async _handleInstall(e, t) {
      this._useDefaultCacheabilityPluginIfNeeded();
      const s = await t.fetch(e);
      if (!(await t.cachePut(e, s.clone())))
        throw new n('bad-precaching-response', {
          url: e.url,
          status: s.status,
        });
      return s;
    }
    _useDefaultCacheabilityPluginIfNeeded() {
      let e = null,
        t = 0;
      for (const [s, a] of this.plugins.entries())
        a !== b.copyRedirectedCacheableResponsesPlugin &&
          (a === b.defaultPrecacheCacheabilityPlugin && (e = s),
          a.cacheWillUpdate && t++);
      t === 0
        ? this.plugins.push(b.defaultPrecacheCacheabilityPlugin)
        : t > 1 && e !== null && this.plugins.splice(e, 1);
    }
  }
  (b.defaultPrecacheCacheabilityPlugin = {
    cacheWillUpdate: async ({ response: e }) =>
      !e || e.status >= 400 ? null : e,
  }),
    (b.copyRedirectedCacheableResponsesPlugin = {
      cacheWillUpdate: async ({ response: e }) =>
        e.redirected ? await f(e) : e,
    });
  class L {
    constructor({
      cacheName: e,
      plugins: t = [],
      fallbackToNetwork: s = !0,
    } = {}) {
      (this._urlsToCacheKeys = new Map()),
        (this._urlsToCacheModes = new Map()),
        (this._cacheKeysToIntegrities = new Map()),
        (this._strategy = new b({
          cacheName: h.getPrecacheName(e),
          plugins: [...t, new d({ precacheController: this })],
          fallbackToNetwork: s,
        })),
        (this.install = this.install.bind(this)),
        (this.activate = this.activate.bind(this));
    }
    get strategy() {
      return this._strategy;
    }
    precache(e) {
      this.addToCacheList(e),
        this._installAndActiveListenersAdded ||
          (self.addEventListener('install', this.install),
          self.addEventListener('activate', this.activate),
          (this._installAndActiveListenersAdded = !0));
    }
    addToCacheList(e) {
      const t = [];
      for (const s of e) {
        typeof s == 'string'
          ? t.push(s)
          : s && void 0 === s.revision && t.push(s.url);
        const { cacheKey: e, url: a } = ((e) => {
            if (!e)
              throw new n('add-to-cache-list-unexpected-type', { entry: e });
            if (typeof e == 'string') {
              const t = new URL(e, location.href);
              return { cacheKey: t.href, url: t.href };
            }
            const { revision: t, url: s } = e;
            if (!s)
              throw new n('add-to-cache-list-unexpected-type', { entry: e });
            if (!t) {
              const e = new URL(s, location.href);
              return { cacheKey: e.href, url: e.href };
            }
            const a = new URL(s, location.href),
              i = new URL(s, location.href);
            return (
              a.searchParams.set('__WB_REVISION__', t),
              { cacheKey: a.href, url: i.href }
            );
          })(s),
          i = typeof s != 'string' && s.revision ? 'reload' : 'default';
        if (this._urlsToCacheKeys.has(a) && this._urlsToCacheKeys.get(a) !== e)
          throw new n('add-to-cache-list-conflicting-entries', {
            firstEntry: this._urlsToCacheKeys.get(a),
            secondEntry: e,
          });
        if (typeof s != 'string' && s.integrity) {
          if (
            this._cacheKeysToIntegrities.has(e) &&
            this._cacheKeysToIntegrities.get(e) !== s.integrity
          )
            throw new n('add-to-cache-list-conflicting-integrities', {
              url: a,
            });
          this._cacheKeysToIntegrities.set(e, s.integrity);
        }
        this._urlsToCacheKeys.set(a, e),
          this._urlsToCacheModes.set(a, i),
          t.length > 0 &&
            console.warn(`Workbox is precaching URLs without revision info: ${t.join(', ')}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`);
      }
    }
    install(e) {
      return o(e, async () => {
        const t = new u();
        for (const [s, a] of (this.strategy.plugins.push(t),
        this._urlsToCacheKeys)) {
          const t = this._cacheKeysToIntegrities.get(a),
            i = this._urlsToCacheModes.get(s),
            r = new Request(s, {
              integrity: t,
              cache: i,
              credentials: 'same-origin',
            });
          await Promise.all(
            this.strategy.handleAll({
              params: { cacheKey: a },
              request: r,
              event: e,
            })
          );
        }
        const { updatedURLs: s, notUpdatedURLs: a } = t;
        return { updatedURLs: s, notUpdatedURLs: a };
      });
    }
    activate(e) {
      return o(e, async () => {
        const e = await self.caches.open(this.strategy.cacheName),
          t = await e.keys(),
          s = new Set(this._urlsToCacheKeys.values()),
          a = [];
        for (const i of t) s.has(i.url) || (await e.delete(i), a.push(i.url));
        return { deletedURLs: a };
      });
    }
    getURLsToCacheKeys() {
      return this._urlsToCacheKeys;
    }
    getCachedURLs() {
      return [...this._urlsToCacheKeys.keys()];
    }
    getCacheKeyForURL(e) {
      const t = new URL(e, location.href);
      return this._urlsToCacheKeys.get(t.href);
    }
    getIntegrityForCacheKey(e) {
      return this._cacheKeysToIntegrities.get(e);
    }
    async matchPrecache(e) {
      const t = e instanceof Request ? e.url : e,
        s = this.getCacheKeyForURL(t);
      if (s) return (await self.caches.open(this.strategy.cacheName)).match(s);
    }
    createHandlerBoundToURL(e) {
      const t = this.getCacheKeyForURL(e);
      if (!t) throw new n('non-precached-url', { url: e });
      return (s) => (
        (s.request = new Request(e)),
        (s.params = { cacheKey: t, ...s.params }),
        this.strategy.handle(s)
      );
    }
  }
  const T = () => (t || (t = new L()), t);
  r(227);
  const U = (e) => (e && typeof e == 'object' ? e : { handle: e });
  class k {
    constructor(e, t, s = 'GET') {
      (this.handler = U(t)), (this.match = e), (this.method = s);
    }
    setCatchHandler(e) {
      this.catchHandler = U(e);
    }
  }
  class P extends k {
    constructor(e, t, s) {
      super(
        ({ url: t }) => {
          const s = e.exec(t.href);
          if (s)
            return t.origin !== location.origin && s.index !== 0
              ? void 0
              : s.slice(1);
        },
        t,
        s
      );
    }
  }
  class K {
    constructor() {
      (this._routes = new Map()), (this._defaultHandlerMap = new Map());
    }
    get routes() {
      return this._routes;
    }
    addFetchListener() {
      self.addEventListener('fetch', (e) => {
        const { request: t } = e,
          s = this.handleRequest({ request: t, event: e });
        s && e.respondWith(s);
      });
    }
    addCacheListener() {
      self.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'CACHE_URLS') {
          const { payload: t } = e.data,
            s = Promise.all(
              t.urlsToCache.map((t) => {
                typeof t == 'string' && (t = [t]);
                const s = new Request(...t);
                return this.handleRequest({ request: s, event: e });
              })
            );
          e.waitUntil(s),
            e.ports && e.ports[0] && s.then(() => e.ports[0].postMessage(!0));
        }
      });
    }
    handleRequest({ request: e, event: t }) {
      let s,
        a = new URL(e.url, location.href);
      if (!a.protocol.startsWith('http')) return;
      let i = a.origin === location.origin,
        { params: r, route: n } = this.findMatchingRoute({
          event: t,
          request: e,
          sameOrigin: i,
          url: a,
        }),
        l = n && n.handler,
        c = e.method;
      if (
        (!l &&
          this._defaultHandlerMap.has(c) &&
          (l = this._defaultHandlerMap.get(c)),
        !l)
      )
        return;
      try {
        s = l.handle({ url: a, request: e, event: t, params: r });
      } catch (e) {
        s = Promise.reject(e);
      }
      const h = n && n.catchHandler;
      return (
        s instanceof Promise &&
          (this._catchHandler || h) &&
          (s = s.catch(async (s) => {
            if (h)
              try {
                return await h.handle({
                  url: a,
                  request: e,
                  event: t,
                  params: r,
                });
              } catch (e) {
                e instanceof Error && (s = e);
              }
            if (this._catchHandler)
              return this._catchHandler.handle({
                url: a,
                request: e,
                event: t,
              });
            throw s;
          })),
        s
      );
    }
    findMatchingRoute({ url: e, sameOrigin: t, request: s, event: a }) {
      for (const i of this._routes.get(s.method) || []) {
        let r,
          n = i.match({ url: e, sameOrigin: t, request: s, event: a });
        if (n)
          return (
            (Array.isArray((r = n)) && r.length === 0) ||
            (n.constructor === Object && Object.keys(n).length === 0)
              ? (r = void 0)
              : typeof n == 'boolean' && (r = void 0),
            { route: i, params: r }
          );
      }
      return {};
    }
    setDefaultHandler(e, t = 'GET') {
      this._defaultHandlerMap.set(t, U(e));
    }
    setCatchHandler(e) {
      this._catchHandler = U(e);
    }
    registerRoute(e) {
      this._routes.has(e.method) || this._routes.set(e.method, []),
        this._routes.get(e.method).push(e);
    }
    unregisterRoute(e) {
      if (!this._routes.has(e.method))
        throw new n('unregister-route-but-not-found-with-method', {
          method: e.method,
        });
      const t = this._routes.get(e.method).indexOf(e);
      if (t > -1) this._routes.get(e.method).splice(t, 1);
      else throw new n('unregister-route-route-not-registered');
    }
  }
  function N(e, t, a) {
    let i;
    if (typeof e == 'string') {
      const s = new URL(e, location.href);
      i = new k(({ url: e }) => e.href === s.href, t, a);
    } else if (e instanceof RegExp) i = new P(e, t, a);
    else if (typeof e == 'function') i = new k(e, t, a);
    else if (e instanceof k) i = e;
    else
      throw new n('unsupported-route-type', {
        moduleName: 'workbox-routing',
        funcName: 'registerRoute',
        paramName: 'capture',
      });
    return (
      (!s && ((s = new K()).addFetchListener(), s.addCacheListener()),
      s).registerRoute(i),
      i
    );
  }
  class x extends k {
    constructor(e, t) {
      super(({ request: s }) => {
        const a = e.getURLsToCacheKeys();
        for (const i of (function* (
          e,
          {
            ignoreURLParametersMatching: t = [/^utm_/, /^fbclid$/],
            directoryIndex: s = 'index.html',
            cleanURLs: a = !0,
            urlManipulation: i,
          } = {}
        ) {
          const r = new URL(e, location.href);
          (r.hash = ''), yield r.href;
          const n = ((e, t = []) => {
            for (const s of [...e.searchParams.keys()])
              t.some((e) => e.test(s)) && e.searchParams.delete(s);
            return e;
          })(r, t);
          if ((yield n.href, s && n.pathname.endsWith('/'))) {
            const e = new URL(n.href);
            (e.pathname += s), yield e.href;
          }
          if (a) {
            const e = new URL(n.href);
            (e.pathname += '.html'), yield e.href;
          }
          if (i) for (const e of i({ url: r })) yield e.href;
        })(s.url, t)) {
          const t = a.get(i);
          if (t) {
            const s = e.getIntegrityForCacheKey(t);
            return { cacheKey: t, integrity: s };
          }
        }
      }, e.strategy);
    }
  }
  const E = '-precache-',
    q = async (e, t = E) => {
      const s = (await self.caches.keys()).filter(
        (s) => s.includes(t) && s.includes(self.registration.scope) && s !== e
      );
      return await Promise.all(s.map((e) => self.caches.delete(e))), s;
    };
  class W extends k {
    constructor(e, { allowlist: t = [/./], denylist: s = [] } = {}) {
      super((e) => this._match(e), e),
        (this._allowlist = t),
        (this._denylist = s);
    }
    _match({ url: e, request: t }) {
      if (t && t.mode !== 'navigate') return !1;
      const s = e.pathname + e.search;
      for (const e of this._denylist) if (e.test(s)) return !1;
      return !!this._allowlist.some((e) => e.test(s));
    }
  }
  const M = {
    cacheWillUpdate: async ({ response: e }) =>
      e.status === 200 || e.status === 0 ? e : null,
  };
  class S extends v {
    constructor(e = {}) {
      super(e),
        this.plugins.some((e) => 'cacheWillUpdate' in e) ||
          this.plugins.unshift(M),
        (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0);
    }
    async _handle(e, t) {
      let s,
        a = [],
        i = [];
      if (this._networkTimeoutSeconds) {
        const { id: r, promise: n } = this._getTimeoutPromise({
          request: e,
          logs: a,
          handler: t,
        });
        (s = r), i.push(n);
      }
      const r = this._getNetworkPromise({
        timeoutId: s,
        request: e,
        logs: a,
        handler: t,
      });
      i.push(r);
      const l = await t.waitUntil(
        (async () => (await t.waitUntil(Promise.race(i))) || (await r))()
      );
      if (!l) throw new n('no-response', { url: e.url });
      return l;
    }
    _getTimeoutPromise({ request: e, logs: t, handler: s }) {
      let a;
      return {
        promise: new Promise((t) => {
          a = setTimeout(async () => {
            t(await s.cacheMatch(e));
          }, 1e3 * this._networkTimeoutSeconds);
        }),
        id: a,
      };
    }
    async _getNetworkPromise({
      timeoutId: e,
      request: t,
      logs: s,
      handler: a,
    }) {
      let i, r;
      try {
        r = await a.fetchAndCachePut(t);
      } catch (e) {
        e instanceof Error && (i = e);
      }
      return e && clearTimeout(e), (i || !r) && (r = await a.cacheMatch(t)), r;
    }
  }
  class I extends v {
    constructor(e = {}) {
      super(e),
        this.plugins.some((e) => 'cacheWillUpdate' in e) ||
          this.plugins.unshift(M);
    }
    async _handle(e, t) {
      let s,
        a = t.fetchAndCachePut(e).catch(() => {});
      t.waitUntil(a);
      let i = await t.cacheMatch(e);
      if (i);
      else
        try {
          i = await a;
        } catch (e) {
          e instanceof Error && (s = e);
        }
      if (!i) throw new n('no-response', { url: e.url, error: s });
      return i;
    }
  }
  self.addEventListener('activate', (e) => {
    const t = h.getPrecacheName();
    e.waitUntil(q(t).then((e) => {}));
  }),
    ((e, t) => {
      T().precache(e), N(new x(T(), void 0));
    })([
      {
        revision: '123df6cf89710efc4ca211d203e31d2e',
        url: '/_next/app-build-manifest.json',
      },
      {
        revision: 'd4ce2f362094bfa776ececc5a57bcddc',
        url: '/_next/build-manifest.json',
      },
      {
        revision: '99914b932bd37a50b983c5e7c90ae93b',
        url: '/_next/react-loadable-manifest.json',
      },
      {
        revision: 'aa84dda47a2bfdc98d2db3414216d668',
        url: '/_next/server/middleware-build-manifest.js',
      },
      {
        revision: '49318b1fadb2d705059a2e0d8df88bb6',
        url: '/_next/server/middleware-react-loadable-manifest.js',
      },
      {
        revision: '74e348d885d69feee6b1e6fa875c6cf7',
        url: '/_next/server/next-font-manifest.js',
      },
      {
        revision: '920ec62dc015cf6c496c20d764bc2553',
        url: '/_next/server/next-font-manifest.json',
      },
      {
        revision: 'a8bc11c8c3293c5f0602d02f2ec83352',
        url: '/_next/static/LW7D8EJ4z8GeKf6MCrBIR/_buildManifest.js',
      },
      {
        revision: 'b6652df95db52feb4daf4eca35380933',
        url: '/_next/static/LW7D8EJ4z8GeKf6MCrBIR/_ssgManifest.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/4bd1b696-cf72ae8a39fa05aa.js',
      },
      { revision: null, url: '/_next/static/chunks/621-a864268fee2b6472.js' },
      { revision: null, url: '/_next/static/chunks/964-d6e2a37b7965f281.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/_not-found/page-8dcf96ef51683b1c.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/api/trpc/[trpc]/route-f1fd6603fd10202e.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/layout-0f26c7f812be2200.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/page-07244e2b6ab7fdaf.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/framework-7c95b8e5103c9e90.js',
      },
      { revision: null, url: '/_next/static/chunks/main-34987b2720640f92.js' },
      {
        revision: null,
        url: '/_next/static/chunks/main-app-7d5bb0afac528ae9.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/pages/_app-0a0020ddd67f79cf.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/pages/_error-03529f2c21436739.js',
      },
      {
        revision: '846118c33b2c0e922d7b3a7676f81f6f',
        url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/webpack-cc3d3e340f40b136.js',
      },
      { revision: null, url: '/_next/static/css/1d5d21a9cb195f98.css' },
      { revision: null, url: '/_next/static/css/c00a63b51b0e21cf.css' },
      {
        revision: '7e4af5fbbda38fc26b3c05fbaa79853c',
        url: '/_next/static/media/01783a3bc056e56f-s.woff2',
      },
      {
        revision: 'fa23299ab54643289d1c6952cf159704',
        url: '/_next/static/media/022dd37e2f08cdd6-s.woff2',
      },
      {
        revision: '8f58b5fbea15d369b3cc07e6f8f28be3',
        url: '/_next/static/media/064650ee37f6fe5d-s.woff2',
      },
      {
        revision: '974d1483294797620012cd183bfda159',
        url: '/_next/static/media/08ed875ba6af5901-s.woff2',
      },
      {
        revision: 'c8d5740027b9117b1695859dfcc40a42',
        url: '/_next/static/media/0b0208c8ade704aa-s.woff2',
      },
      {
        revision: '74a9373269271e4f24b25ae51d5d454c',
        url: '/_next/static/media/0b70d69f72f0cf78-s.woff2',
      },
      {
        revision: '0229dcd4a86bea9165e9af21a3aca95d',
        url: '/_next/static/media/0b782537e27bafde-s.woff2',
      },
      {
        revision: '6f0e8bf03e3feacd0b722d1d92a88c32',
        url: '/_next/static/media/0b8c793eb336a210-s.woff2',
      },
      {
        revision: '484f60ececb17e4c01d1bbe960823f9a',
        url: '/_next/static/media/12499b4df1574f29-s.woff2',
      },
      {
        revision: 'ca204c64aed8565f5fe5bf19adae16b0',
        url: '/_next/static/media/13338b320018ce34-s.woff2',
      },
      {
        revision: '3409d631e978517466a497770e4c05f8',
        url: '/_next/static/media/138fda7dd641fcaf-s.woff2',
      },
      {
        revision: 'bae212da625deda207574eae364ef7f7',
        url: '/_next/static/media/13b547f74fe76fa6-s.woff2',
      },
      {
        revision: 'fe10865cfba711b93b761a1048a1a1ce',
        url: '/_next/static/media/165d1bec4903bc8a-s.woff2',
      },
      {
        revision: 'd24cbc50ee4a292aa38f93e6e261c801',
        url: '/_next/static/media/17668c98f2d14886-s.woff2',
      },
      {
        revision: '6272d6304fbc8280e5d9e7c1070a5cf5',
        url: '/_next/static/media/18660be8cb0a4180-s.woff2',
      },
      {
        revision: '8eb716df9d6301b15b4f3d3ada599fbf',
        url: '/_next/static/media/1c275f94b2a90428-s.woff2',
      },
      {
        revision: '3c5e2ee5bef17979cc09eda66bd7947c',
        url: '/_next/static/media/1dbdfbd07d1a1c4a-s.woff2',
      },
      {
        revision: '71efe205a1d627b15dfcb979033bc7ff',
        url: '/_next/static/media/242ceef87f7fd2be-s.woff2',
      },
      {
        revision: '0ec81a185e9a9a46ae88fc9df9ce1833',
        url: '/_next/static/media/24b453889d6b036f-s.woff2',
      },
      {
        revision: 'aa9f4b61166e91280003b28a0d74d4ea',
        url: '/_next/static/media/24ccd7def1bf3767-s.woff2',
      },
      {
        revision: 'd72fe844972ce9b9a2c97939b5e45350',
        url: '/_next/static/media/25a0b1974b6def0d-s.woff2',
      },
      {
        revision: '4dcd6a7a027ada46c3b6f0d4bc85855b',
        url: '/_next/static/media/26ca3fc8ff1f01a7-s.woff2',
      },
      {
        revision: '94a4aa641e5a2692fa2473ff71dba6a8',
        url: '/_next/static/media/2b53d5c8e1d4361f-s.woff2',
      },
      {
        revision: '684d06ad8f4db7f099ef573ba7bd336a',
        url: '/_next/static/media/2c8cc002d13ad3b0-s.woff2',
      },
      {
        revision: 'da47d300b72a21601dce20f31a00d8d2',
        url: '/_next/static/media/2e72dfd3cdf7ffad-s.woff2',
      },
      {
        revision: '2db361afe9448418ca0d63b0fd30b86c',
        url: '/_next/static/media/308090c1282598c4-s.woff2',
      },
      {
        revision: '46f7a1c00cc7ebc22a141f3793221ba8',
        url: '/_next/static/media/317acfb7a7fd9ef4-s.woff2',
      },
      {
        revision: 'cb327402281bafd148bcfb03659b184f',
        url: '/_next/static/media/325e377b51cfc18f-s.woff2',
      },
      {
        revision: '4104b2b37abc7722668aa2c438590816',
        url: '/_next/static/media/38a46bc2cf9558d2-s.woff2',
      },
      {
        revision: 'a7f5441e1afa2977b9ff39ad3d51ea99',
        url: '/_next/static/media/3a50c82c6a132c97-s.woff2',
      },
      {
        revision: 'b779808eb7d199f75cf0d44a759b8572',
        url: '/_next/static/media/3a9d41f16cd4af61-s.woff2',
      },
      {
        revision: '0260beceac83ad7b7b29c846b4bcdc30',
        url: '/_next/static/media/3c1eeca6611a169a-s.woff2',
      },
      {
        revision: '7bdd99c9e488022d0b660ceacccb5588',
        url: '/_next/static/media/3e139bb90693c9e5-s.woff2',
      },
      {
        revision: '66b01ce421c2a005df53dab76d3d7b2b',
        url: '/_next/static/media/412dad318b297fe4-s.woff2',
      },
      {
        revision: '3dc7d00d186ff994f9eceedcc5ea80fb',
        url: '/_next/static/media/45a0cfac6c6fe56d-s.woff2',
      },
      {
        revision: '569e9fb4f2e4a34faf18849586bf08d6',
        url: '/_next/static/media/460be057f9c545ff-s.woff2',
      },
      {
        revision: 'a534ad582cf3ba4b997aa1d6f2641420',
        url: '/_next/static/media/472158a64470448d-s.woff2',
      },
      {
        revision: '3ff0ddb3ce321caea0da38167bca026f',
        url: '/_next/static/media/472a2b0cb4e88cd3-s.woff2',
      },
      {
        revision: '66a987a51fca9411c521c24c17c3b2f9',
        url: '/_next/static/media/4db9b6f68b0c3a4c-s.woff2',
      },
      {
        revision: '8b540a7bda95f8d7f903c31bbbc7c791',
        url: '/_next/static/media/4e81bc23fbc4406d-s.woff2',
      },
      {
        revision: '9052566be107b7f366f0220505c0b537',
        url: '/_next/static/media/502d6ad489d0f30f-s.woff2',
      },
      {
        revision: 'f8f09cbe8af6748232cc82c53ae768ba',
        url: '/_next/static/media/50d6790c90864be5-s.woff2',
      },
      {
        revision: '7573edc13d1ca6b81742ca5d7ab5a697',
        url: '/_next/static/media/529bd20adcb56129-s.woff2',
      },
      {
        revision: '956d198b3861bd4d024e5d1a59c068e6',
        url: '/_next/static/media/549d05d67f881743-s.woff2',
      },
      {
        revision: '9b283c2ab855e7c796de6f1b358745fb',
        url: '/_next/static/media/557bd3dc341cbd93-s.woff2',
      },
      {
        revision: 'b18a034b64fb6bb7bc89598613190dfc',
        url: '/_next/static/media/57d5a814b99db80f-s.woff2',
      },
      {
        revision: '03620e59a935e9ee94b67c83b7dc589e',
        url: '/_next/static/media/5d5ddaf3d5b032a9-s.woff2',
      },
      {
        revision: '292c713c21c46f939ca4ce7ce2a7facc',
        url: '/_next/static/media/6309d608cf95f0c2-s.woff2',
      },
      {
        revision: '1653099e05c62041a5aff4b69f9c3a1a',
        url: '/_next/static/media/65ebb30b66baf017-s.woff2',
      },
      {
        revision: '9063242a212232ba245fbecb12132cdd',
        url: '/_next/static/media/6a0819df3bc9fe9c-s.woff2',
      },
      {
        revision: 'ab2c0fa42e3051f5f1a190e40feb8bd9',
        url: '/_next/static/media/6b837c78d2191b9c-s.woff2',
      },
      {
        revision: '601bc98bf3b0cd20162d61cc8210fde1',
        url: '/_next/static/media/6f10db121bc2e9d9-s.woff2',
      },
      {
        revision: 'ffc0177b5eb0cb1b3135d6a2f1c0e51f',
        url: '/_next/static/media/6f1a3e3a4a2b2947-s.woff2',
      },
      {
        revision: '27ba7f905cbba2078e367ac2cc596283',
        url: '/_next/static/media/712ddbd38f8e6e55-s.woff2',
      },
      {
        revision: '92862aea5c2b8904734752ab2fa6fe0e',
        url: '/_next/static/media/7280fe7b70c906ac-s.woff2',
      },
      {
        revision: '32cc10207bfbc8dcb58887c5a2812581',
        url: '/_next/static/media/75402959356e5d7b-s.woff2',
      },
      {
        revision: '1f0ece8ae0713e9aa8344cda3a1e3cbe',
        url: '/_next/static/media/76faea6d15b9ee04-s.woff2',
      },
      {
        revision: 'ecc4c2ba710360ac3ff404683b8d3760',
        url: '/_next/static/media/7945c517e88ac346-s.woff2',
      },
      {
        revision: '1677aae958ab13327c872cd7cf291d71',
        url: '/_next/static/media/7fa1502148328267-s.woff2',
      },
      {
        revision: 'cc34c4f247f19b43c64ee27f62548fe9',
        url: '/_next/static/media/8110ac68abb95f14-s.woff2',
      },
      {
        revision: '64aa7ad81307f44104f339e9da77de2c',
        url: '/_next/static/media/81225699b484627e-s.woff2',
      },
      {
        revision: 'd929a648bf7ec70d177e570c34e8247c',
        url: '/_next/static/media/85e882c981d7477f-s.woff2',
      },
      {
        revision: '86953c325f14817df8dc46400626bb1d',
        url: '/_next/static/media/868e3a09759b01ef-s.woff2',
      },
      {
        revision: 'c3ada8a1038d12fabb53884d3c57c4ee',
        url: '/_next/static/media/88cdd0d8bb261763-s.woff2',
      },
      {
        revision: '35f849a058323f45fbe1075ba64c1332',
        url: '/_next/static/media/8e41d663481534ee-s.woff2',
      },
      {
        revision: 'a1f6940dbb9145ab7b932399827861ad',
        url: '/_next/static/media/924632e82f71afa9-s.woff2',
      },
      {
        revision: 'a2eeafffb428ad2bcd9e64f26e94d702',
        url: '/_next/static/media/933f24feb95e5b64-s.woff2',
      },
      {
        revision: '45d39345753dc35565ea7205670aabd3',
        url: '/_next/static/media/93c033d43a20fa8a-s.woff2',
      },
      {
        revision: '7ccbdb0957d582d1402e5a0a9e892f70',
        url: '/_next/static/media/95c578d6e62f220f-s.woff2',
      },
      {
        revision: '06f0ccfb63038cec950e534c12057033',
        url: '/_next/static/media/96462d648a586017-s.woff2',
      },
      {
        revision: '1a4a11ae399472eadb42e6ab1dac2f51',
        url: '/_next/static/media/986479ee91dce845-s.woff2',
      },
      {
        revision: 'e7a758eb6699b87013a287e56d178839',
        url: '/_next/static/media/98ac67f95b919b4b-s.woff2',
      },
      {
        revision: 'da5aa5ffc34c6881d0fb4cb70b36d890',
        url: '/_next/static/media/a0a434b092ce2e6c-s.woff2',
      },
      {
        revision: '4066e2838cc58d92703489f52789eb05',
        url: '/_next/static/media/a2e608e4b23dbb94-s.woff2',
      },
      {
        revision: '4342c30612ac18816a3c2fe3b601f18d',
        url: '/_next/static/media/a2ed1ad527c75b36-s.woff2',
      },
      {
        revision: '9353119e4809074a48d8047857517ec3',
        url: '/_next/static/media/a347360fd731f8bd-s.woff2',
      },
      {
        revision: '1afe9f607e67602ad5eccd4b1e66b3eb',
        url: '/_next/static/media/a449c0e5b25aaeae-s.woff2',
      },
      {
        revision: '857d979a63a7f7cab2a5f791ac60f979',
        url: '/_next/static/media/a47d01be8904756a-s.woff2',
      },
      {
        revision: '88b71ecda205a5b170f17a169d63585f',
        url: '/_next/static/media/a87149f05215fd70-s.woff2',
      },
      {
        revision: 'bacb5e53cf2412ded3c774677b9b1bc9',
        url: '/_next/static/media/af06b7be4fed8d0c-s.woff2',
      },
      {
        revision: 'bcb000d75ccbf9872927ec9ab1936899',
        url: '/_next/static/media/b0f2cb8585af4651-s.woff2',
      },
      {
        revision: 'cf94e3b8f63ea321f4703f61560f87df',
        url: '/_next/static/media/b1fe58d6b96e215a-s.woff2',
      },
      {
        revision: '18adc6e31e5b72a14da7418e7cc7301d',
        url: '/_next/static/media/b21fe1dccb7cf0f2-s.woff2',
      },
      {
        revision: '958a7fe22f3614f70fb307ac0db88d9c',
        url: '/_next/static/media/b34c696765196c00-s.woff2',
      },
      {
        revision: '48cb7180e94e3c75519b781c7747a789',
        url: '/_next/static/media/b4cfe38dad5cc580-s.woff2',
      },
      {
        revision: '47b4e2e9c8eb303f04349b3a2d9e99ce',
        url: '/_next/static/media/b66b83e3d3dd0f65-s.woff2',
      },
      {
        revision: '366fa6a99160d622ba8867cc78974cd6',
        url: '/_next/static/media/b918547d75fe022d-s.woff2',
      },
      {
        revision: 'eeecf3f49dc5ce659d8631fde5523e9a',
        url: '/_next/static/media/badccdd652cdbd7a-s.woff2',
      },
      {
        revision: '91c419c956c72299535edf109b1e2424',
        url: '/_next/static/media/bc792a749a0f952a-s.woff2',
      },
      {
        revision: '7e13b825af5a41819801d0eb507945ec',
        url: '/_next/static/media/c0891ead9904f94c-s.woff2',
      },
      {
        revision: '748cca3ffac65705fb8c35a7919bb35c',
        url: '/_next/static/media/c3c4b302e24da2c0-s.woff2',
      },
      {
        revision: '84602c1d2de9c8c623668e32dd0a8437',
        url: '/_next/static/media/c60c6dab5d1039a0-s.woff2',
      },
      {
        revision: 'f8aa9916e1268d1e8141420330ce8b0d',
        url: '/_next/static/media/c6b48c949aa0b94a-s.woff2',
      },
      {
        revision: '55a47d54e0a8f6ba62dcbd2825880713',
        url: '/_next/static/media/c6cc1fbb83f22411-s.woff2',
      },
      {
        revision: '1045f2909fc284f477f03f17999fdb4e',
        url: '/_next/static/media/c7ac8b1c27af78c3-s.woff2',
      },
      {
        revision: 'cae47c7aeed72e00c5aed704c1dc4931',
        url: '/_next/static/media/c7c490eb3c1540f1-s.woff2',
      },
      {
        revision: 'e8eddbb0102dbc6ab4f10a90a910b290',
        url: '/_next/static/media/cabd75b7c8d460b0-s.woff2',
      },
      {
        revision: 'b3b616cbbdc3a2a923ac104a3bab134a',
        url: '/_next/static/media/cb02e5b057cc9aca-s.woff2',
      },
      {
        revision: 'a283ff14b9dcc91071b5b01905065e33',
        url: '/_next/static/media/cb6cd68d493cea90-s.woff2',
      },
      {
        revision: '23e41bd1dcc47c9aabedf0a6eac8c5a1',
        url: '/_next/static/media/cd5bffea26fe9226-s.woff2',
      },
      {
        revision: '9357ae29250a95a5f46d319fff8a5e41',
        url: '/_next/static/media/cf345c3ff1217bac-s.woff2',
      },
      {
        revision: '74013be5e4d5b0f4ad1da83487ee2fe7',
        url: '/_next/static/media/d21b537f0b988f10-s.woff2',
      },
      {
        revision: 'bbe19e7bad858d0f1db649419c5677ee',
        url: '/_next/static/media/d46cd3aef29682b1-s.woff2',
      },
      {
        revision: '6414821329fad4cca03ee0375b7cbc61',
        url: '/_next/static/media/dd750986f328834b-s.woff2',
      },
      {
        revision: 'bd1be08a9267b841e417653acd78d225',
        url: '/_next/static/media/dee24bdf7bd0cd8d-s.woff2',
      },
      {
        revision: '147b8cabef1faf386ca779566df32609',
        url: '/_next/static/media/df66cbd548741253-s.woff2',
      },
      {
        revision: '8e2f833df820b0ab856e7627578e37e5',
        url: '/_next/static/media/e055a44c3111783b-s.woff2',
      },
      {
        revision: '393bb5dbc58cc56a38f18bc1ec0698ad',
        url: '/_next/static/media/e2d6277522db2acb-s.woff2',
      },
      {
        revision: 'f214945aa05fa5dbd6ec2aa57dfca9b4',
        url: '/_next/static/media/e5cf24b7040f8329-s.woff2',
      },
      {
        revision: '2a2f1c2a3a07baf9eb9d50b3afdfcc18',
        url: '/_next/static/media/e6ee6d13696ffd84-s.woff2',
      },
      {
        revision: '809406e8255949e87df27975363719b9',
        url: '/_next/static/media/e73661653a464792-s.woff2',
      },
      {
        revision: 'ed42f95da3e4e04bc139d41746ee37f8',
        url: '/_next/static/media/e7acd39a4cc6bfe0-s.woff2',
      },
      {
        revision: '8d3b1a527047288b3780da58b289a1ad',
        url: '/_next/static/media/e8223f31b060fe8e-s.woff2',
      },
      {
        revision: '57089ddbeb0488de4fd40d9eaa7eb66e',
        url: '/_next/static/media/e8bfc4466328f848-s.woff2',
      },
      {
        revision: '65be0deccf79435dee3dd3cbc51acd9e',
        url: '/_next/static/media/ea20c97fbf775633-s.woff2',
      },
      {
        revision: '6eb88837e7f2a80f04d8d4752214b8e8',
        url: '/_next/static/media/ea5ec6384598e291-s.woff2',
      },
      {
        revision: '5223649b907dd86fad9906e07c6e90f4',
        url: '/_next/static/media/eac7b504f6d6c314-s.woff2',
      },
      {
        revision: 'd96a4a01200d63cc71404d0a9bb60365',
        url: '/_next/static/media/eb7013445c617b43-s.woff2',
      },
      {
        revision: 'e51c26d2e91c66363ea777f1954d8fe8',
        url: '/_next/static/media/ee97138181dc4f5d-s.woff2',
      },
      {
        revision: '0bfd8fff04239d3f410c7c4692e1e0c4',
        url: '/_next/static/media/f12046086cc54003-s.woff2',
      },
      {
        revision: 'cff23473a5a68e3aa5737382155459ea',
        url: '/_next/static/media/f2dba9fbcf2f771b-s.p.woff2',
      },
      {
        revision: '9df245fca5c045b313aa316561ac9699',
        url: '/_next/static/media/f36a2760ab014837-s.woff2',
      },
      {
        revision: '60ff6132bdd46131aad347663929915f',
        url: '/_next/static/media/f8378d74e84d63c2-s.woff2',
      },
      {
        revision: 'bb2002a3338a53bc0fc250ca7a75dc2a',
        url: '/_next/static/media/f8a1416777903b39-s.woff2',
      },
    ]),
    self.addEventListener('message', (e) => {
      e.data && e.data.type === 'SKIP_WAITING' && self.skipWaiting();
    }),
    self.addEventListener('activate', () => {
      self.clients.claim();
    }),
    N(
      (e) => {
        const { request: t } = e;
        returnt.mode === 'navigate';
      },
      new S({
        cacheName: 'pages',
        plugins: [
          {
            cacheKeyWillBeUsed: async (e) => {
              const { request: t } = e,
                s = new URL(t.url);
              return (s.search = ''), s.href;
            },
          },
        ],
      })
    ),
    N(
      (e) => {
        const { request: t } = e;
        returnt.destination === 'style' ||
          t.destination === 'script' ||
          t.destination === 'font' ||
          t.destination === 'image';
      },
      new I({ cacheName: 'static-assets' })
    ),
    N(
      (e) => {
        const { url: t } = e;
        return t.pathname.startsWith('/_next/static/');
      },
      new I({ cacheName: 'next-static' })
    ),
    N(
      (e) => {
        const { url: t } = e;
        return t.pathname.startsWith('/api/');
      },
      new S({ cacheName: 'api', networkTimeoutSeconds: 10 })
    ),
    N(
      new W(T().createHandlerBoundToURL('/'), {
        denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
      })
    ),
    self.addEventListener('message', (e) => {
      e.data &&
        e.data.type === 'TRIGGER_INSTALL' &&
        self.clients.matchAll().then((e) => {
          for (const t of e) t.postMessage({ type: 'SHOW_INSTALL_PROMPT' });
        });
    }),
    self.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'CLIENT_READY') {
        var t;
        (t = e.ports[0]) == null || t.postMessage({ type: 'SW_READY' });
      }
    });
})();
