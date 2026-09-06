// src/util/loginRedirectPage.js

export const getRedirectPathByRole = (roleOrUser) => {
  const user = roleOrUser && typeof roleOrUser === "object" ? roleOrUser : null;
  const role = user?.role || roleOrUser;
  const normalizedRole = role?.toString().toLowerCase().trim();
  const organizationType = user?.organization?.organizationType
    ?.toString()
    .toLowerCase()
    .trim();

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

    case "pio":
    case "p.i.o":
    case "p.i.o.":
    case "public information officer":
      return "/org-pio";

    case "adviser":
      return "/adviser-dashboard";

    case "dean":
      return "/dean-dashboard";

    // Organization Leader / General Student Officer Route
    case "org_admin":
    case "officer":
    case "org_officer":
    case "student_officer":
    case "president":
      return organizationType === "suborganization"
        ? "/suborg-dashboard"
        : "/org-dashboard";

    // Regular Student Member Route
    case "student":
      return "/student-dashboard";

    // Default Fallback
    default:
      return "/student-dashboard";
  }
};
