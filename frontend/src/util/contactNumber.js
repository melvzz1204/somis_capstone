// Shared contact number rule: digits only, exactly 11 characters
// (Philippine mobile format, e.g. 09XXXXXXXXX).
// Use this helper in every dashboard/form that collects a contact number
// so the restriction stays consistent.

export const CONTACT_NUMBER_LENGTH = 11;
export const CONTACT_NUMBER_PATTERN = /^\d{11}$/;

// Strip non-digits and cap at 11 characters while typing/pasting.
export const sanitizeContactNumber = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, CONTACT_NUMBER_LENGTH);

export const isValidContactNumber = (value) =>
  CONTACT_NUMBER_PATTERN.test(String(value ?? "").trim());

export const CONTACT_NUMBER_ERROR =
  "Contact number must be exactly 11 digits (numbers only).";
