import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { TELEMETRY_CONFIG } from "./config/env";
import "./i18n";
import { initTelemetry } from "./telemetry/initTelemetry";
import { telemetryRootOptions } from "./telemetry/reporting";

initTelemetry(TELEMETRY_CONFIG);

createRoot(document.getElementById("root")!, telemetryRootOptions).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <App />
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>
);
