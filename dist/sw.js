/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7218e227'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "index.html",
    "revision": "52224735a1f51b8404ef2330a9625fbf"
  }, {
    "url": "assets/reportMeta-DGaiisq9.js",
    "revision": null
  }, {
    "url": "assets/purify.es-BaNf_EpD.js",
    "revision": null
  }, {
    "url": "assets/publicUrls-CczH-5Fl.js",
    "revision": null
  }, {
    "url": "assets/pdfGenerator-DAquVEao.js",
    "revision": null
  }, {
    "url": "assets/leaflet-src-CAPcTUfH.js",
    "revision": null
  }, {
    "url": "assets/index.es-D8ik9bBh.js",
    "revision": null
  }, {
    "url": "assets/index-CLYdm2C5.js",
    "revision": null
  }, {
    "url": "assets/index-BrGsbkha.css",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-CBrSDip1.js",
    "revision": null
  }, {
    "url": "assets/browser-BXdiCFWD.js",
    "revision": null
  }, {
    "url": "assets/Settings-kmBJnNhw.js",
    "revision": null
  }, {
    "url": "assets/Reports-DZObyorb.js",
    "revision": null
  }, {
    "url": "assets/ReportWizard-_TOXl9GF.js",
    "revision": null
  }, {
    "url": "assets/ReportDetail-Ck5izIO3.js",
    "revision": null
  }, {
    "url": "assets/QRPage-DEHdiFSc.js",
    "revision": null
  }, {
    "url": "assets/QRFieldView-DZuvRinz.js",
    "revision": null
  }, {
    "url": "assets/PublicReportView-1D94Q0SV.js",
    "revision": null
  }, {
    "url": "assets/Primitives-5wFud7Qt.js",
    "revision": null
  }, {
    "url": "assets/Primitives-3MQXPqBX.css",
    "revision": null
  }, {
    "url": "assets/MobileHome-DEUqRxYj.js",
    "revision": null
  }, {
    "url": "assets/Equipment-BA-QWANg.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-fapwo71G.js",
    "revision": null
  }, {
    "url": "assets/Clients-Dbwlhlyz.js",
    "revision": null
  }, {
    "url": "assets/ClientMapWidget-DNaXeLMa.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "885e6617be450820ebdfacdf7582200d"
  }, {
    "url": "favicon.svg",
    "revision": "e0e9a5091bf914561f5812cac6cf41b1"
  }, {
    "url": "pwa-192.png",
    "revision": "2cc6b72e787a0384af814febba46d957"
  }, {
    "url": "pwa-512.png",
    "revision": "bcce4f93b141faea010b660622aa1b7e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "fd2311ca3b5730af276f7118902b5048"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));
  workbox.registerRoute(({
    request
  }) => request.destination === "document", new workbox.NetworkFirst({
    "cacheName": "manttrack-pages",
    "networkTimeoutSeconds": 3,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(({
    url,
    request
  }) => url.pathname.startsWith("/api/") && request.method === "GET", new workbox.NetworkFirst({
    "cacheName": "manttrack-api",
    "networkTimeoutSeconds": 3,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 120,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(({
    request
  }) => ["style", "script", "worker"].includes(request.destination), new workbox.StaleWhileRevalidate({
    "cacheName": "manttrack-assets",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 80,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');
  workbox.registerRoute(({
    request
  }) => request.destination === "image", new workbox.CacheFirst({
    "cacheName": "manttrack-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 80,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');

}));
