import { useNavigate } from "react-router-dom";

export const getRedirectPathByRole = (role) => {
  switch (role?.toLowerCase()) {
    case "treasurer":
      return "/org-treasurer";
    case "secretary":
      return "/org-secretary";
    case "org_admin":
    case "president":
      return "/org-dashboard";
    case "adviser":
      return "/adviser-dashboard";
    default:
      return "/student-dashboard";
  }
};
