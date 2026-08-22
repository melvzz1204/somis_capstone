const PRODUCTION_FRONTEND_URL = "https://somis-capstone.vercel.app";
const DEVELOPMENT_FRONTEND_URL = "http://localhost:5173";

const normalizeUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/$/, "");

const getFrontendUrl = () => {
  const configuredUrl = normalizeUrl(
    process.env.FRONTEND_URL || process.env.CLIENT_URL,
  );

  if (process.env.NODE_ENV === "production") {
    if (configuredUrl && !/localhost|127\.0\.0\.1/i.test(configuredUrl)) {
      return configuredUrl;
    }

    return PRODUCTION_FRONTEND_URL;
  }

  return configuredUrl || DEVELOPMENT_FRONTEND_URL;
};

const createSetupUrl = (token) => {
  const setupUrl = new URL("/setup-account", `${getFrontendUrl()}/`);
  setupUrl.searchParams.set("token", token);
  return setupUrl.toString();
};

module.exports = { createSetupUrl, getFrontendUrl };
