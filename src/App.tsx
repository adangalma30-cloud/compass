import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import BusinessDetail from "./pages/BusinessDetail";
import Auth from "./pages/Auth";
import SplashScreen from "./components/SplashScreen";

// Show splash once per browser session.
const SESSION_KEY = "compass-splash-seen";

function getHasSeenSplash(): boolean {
  // Deep links to auth should be immediately usable; the launch animation
  // remains intact for the normal home-screen entry.
  if (window.location.pathname === "/auth") return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function App() {
  // If the user has already seen the splash this session, skip straight to app.
  const [splashDone, setSplashDone] = useState(getHasSeenSplash);

  function handleSplashComplete() {
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {
      // The app can continue when WebView storage is unavailable.
    }
    setSplashDone(true);
  }

  return (
    <>
      {/* Splash renders as a fixed overlay (z-9999); app renders behind it. */}
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      {/*
       * Always mount the router so the correct URL is parsed immediately.
       * Page entry animations are gated on `splashDone` via the `pageReady` prop.
       */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home pageReady={splashDone} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/business/:id" element={<BusinessDetail />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
