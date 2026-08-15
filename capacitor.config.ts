import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.adangalma30.compass",
  appName: "Compass",
  webDir: "dist",
  android: {
    backgroundColor: "#07132f",
    // Serve the WebView from https://localhost. A secure origin is what allows
    // the Clerk session to persist in Web Storage, so the user stays signed in
    // after closing and reopening the app.
    androidScheme: "https",
  },
};

export default config;