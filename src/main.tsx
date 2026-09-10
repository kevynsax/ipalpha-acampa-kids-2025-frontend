import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { registerSW } from "virtual:pwa-register";
import "./styles.css";

// service worker: precaches the whole app so it opens with no network; new
// builds are picked up silently the next time the app is opened online
registerSW({ immediate: true });

/** dev-only: `?scene=girl|boy` previews the kid icons + play scene without logging in */
const scene = import.meta.env.DEV ? new URLSearchParams(location.search).get("scene") : null;
const ScenePreview = scene ? lazy(() => import("./dev/ScenePreview")) : null;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {ScenePreview ? (
      <Suspense fallback={null}>
        <ScenePreview sex={scene === "girl" ? "girl" : "boy"} />
      </Suspense>
    ) : (
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    )}
  </StrictMode>,
);
