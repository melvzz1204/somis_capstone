// src/util/loginRedirectPage.js

export const getRedirectPathByRole = (role) => {
  const normalizedRole = role?.toString().toLowerCase().trim();

  switch (normalizedRole) {
    // OVPSAS / Admin Route
    case "admin":
    case "ovpsas":
    case "vpsas":
      return "/admin-dashboard";

    // Specific Student Officer Roles
    case "secretary":
    case "org_secretary":
      return "/org-secretary";

    case "treasurer":
    case "org_treasurer":
      return "/org-treasurer";

    // Organization Leader / General Student Officer Route
    case "org_admin":
    case "officer":
    case "org_officer":
    case "student_officer":
    case "president":
      return "/org-dashboard";

    // Regular Student Member Route
    case "student":
      return "/student-dashboard";

    // Default Fallback
    default:
      return "/student-dashboard";
  }
};
