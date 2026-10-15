// One-time Terms & Conditions acceptance, recorded in localStorage so the
// gate only appears once per browser. Bump STORAGE_KEY when the terms
// materially change to require acceptance again.
const STORAGE_KEY = "somis_terms_accepted_v1";

export function hasAcceptedTerms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    return Boolean(JSON.parse(raw)?.accepted);
  } catch {
    return false;
  }
}

export function recordTermsAccepted() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accepted: true, at: new Date().toISOString() }),
    );
    return true;
  } catch {
    // Storage unavailable (private mode, etc.): allow this session only.
    return false;
  }
}
