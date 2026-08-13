import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import Home from "./pages/Home";
import BusinessDetail from "./pages/BusinessDetail";
import Auth, { AuthRedirect } from "./pages/Auth";
import Profile from "./pages/Profile";
import SplashScreen from "./components/SplashScreen";
import { basePath, clerkPubKey, clerkProxyUrl } from "./lib/clerk";

// Show splash once per browser session.
const SESSION_KEY = "compass-splash-seen";

function getHasSeenSplash(): boolean {
  // Deep links to auth should be immediately usable; the launch animation
  // remains intact for the normal home-screen entry.
  if (window.location.pathname.startsWith("/sign-in") || window.location.pathname.startsWith("/sign-up") || window.location.pathname === "/auth") return true;
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

  if (!clerkPubKey) {
    return <div className="min-h-screen bg-[#091735] p-8 text-white">Compass authentication is not configured.</div>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      appearance={{
        options: {
          logoPlacement: "inside",
          logoLinkUrl: basePath || "/",
          logoImageUrl: `${window.location.origin}${basePath}/favicon.svg`,
        },
        variables: {
          colorPrimary: "#5365d1",
          colorForeground: "#17213f",
          colorMutedForeground: "#71809d",
          colorBackground: "#ffffff",
          colorInput: "#f7f8fc",
          colorInputForeground: "#17213f",
          colorNeutral: "#dfe4f0",
          colorDanger: "#c85a67",
          fontFamily: "Inter, system-ui, sans-serif",
          borderRadius: "0.85rem",
        },
      }}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to keep exploring Compass." } },
        signUp: { start: { title: "Create your Compass", subtitle: "Save the places worth coming back to." } },
      }}
    >
      <>
        {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home pageReady={splashDone} />} />
            <Route path="/sign-in/*" element={<Auth mode="signin" />} />
            <Route path="/sign-up/*" element={<Auth mode="signup" />} />
            <Route path="/auth" element={<AuthRedirect />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
          </Routes>
        </BrowserRouter>
      </>
    </ClerkProvider>
  );
}

export default App;
