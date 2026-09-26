import { getRedirectPathByRole } from "./loginRedirectPage";

export const OFFICER_PORTAL_ROLES = [
  "org_admin",
  "secretary",
  "treasurer",
  "pio",
];

export const OFFICER_PORTAL_LABELS = {
  org_admin: "Organization President",
  secretary: "Secretary",
  treasurer: "Treasurer",
  pio: "Public Information Officer",
};

export const MEMBER_PORTAL_PATH = "/student-dashboard";

// An account registered as an org officer that is also present as a regular
// member gets to pick a workspace on sign-in instead of being forced into
// one portal.
export const shouldOfferPortalChoice = (user) =>
  OFFICER_PORTAL_ROLES.includes(user?.role) && user?.isAlsoMember === true;

export const getOfficerPortalLabel = (role) =>
  OFFICER_PORTAL_LABELS[role] || "Organization Officer";

export const resolveOfficerPortalPath = (user) =>
  getRedirectPathByRole(user?.role || "officer");
