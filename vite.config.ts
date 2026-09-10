import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // Installable PWA. The service worker precaches the whole build (JS, CSS,
    // every image) so the app opens with zero network — the data itself lives
    // in localStorage (see src/store) and is fed by the WebSocket.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        id: "/",
        name: "Acampa Kids · IP Alphaville",
        short_name: "Acampa Kids",
        description: "Gestão do acampamento de crianças da Igreja Presbiteriana em Alphaville",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#183d36",
        theme_color: "#183d36",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        // the paper-cut art is a few hundred KB each — raise the default 2 MiB limit just in case
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "/index.html",
        // never try to cache the API / websocket
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // images uploaded through the editor (preparation / instructions) are immutable:
        // cache them on first sight so they still show with no connectivity at the camp
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\/api\/files\/[a-f0-9]+$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "acampa-files",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
