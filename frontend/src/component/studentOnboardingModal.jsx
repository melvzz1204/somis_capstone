import { useState, useEffect } from "react";
import API from "../api/axios";
import { useToast } from "../util/toastContext";
import { applySectionPrefix, getSectionPrefix } from "../util/academicSection";

// Inline Icons
const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const ShieldCheckIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const AcademicCapIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 14l9-5-9-5-9 5 9 5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
    />
  </svg>
);

const EnvelopeIcon = ({ className = "" }) => (
  <svg
    className={`w-5 h-5 shrink-0 ${className}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const ArrowLeftIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const CheckCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const TODAY_DATE_STRING = getTodayDateString();

export default function StudentOnboardingModal({
  isOpen = true,
  onClose,
  onFinish,
  onOfficerSelect,
  initialStep = 2,
}) {
  const { showToast } = useToast();
  const [step, setStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(true);
  const [collegeError, setCollegeError] = useState("");
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  const [organizationError, setOrganizationError] = useState("");

  const [formData, setFormData] = useState({
    role: "",
    college: "",
    organizationId: "",
    program: "",
    section: "",
    yearLevel: "1st Year",
    firstName: "",
    middleInitial: "",
    lastName: "",
    suffix: "",
    idNumber: "",
    contactNumber: "",
    birthDate: "",
    officialEmail: "",
  });

  useEffect(() => {
    const stepUpdate = window.setTimeout(() => setStep(initialStep), 0);
    return () => window.clearTimeout(stepUpdate);
  }, [initialStep]);

  useEffect(() => {
    const controller = new AbortController();
    const request = window.setTimeout(async () => {
      setIsLoadingColleges(true);
      setCollegeError("");
      try {
        const data = await API.get("/colleges", { signal: controller.signal });
        setColleges(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.originalError?.code !== "ERR_CANCELED") {
          setColleges([]);
          setCollegeError(err.message || "Unable to load colleges.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingColleges(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(request);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!formData.college) return undefined;

    const controller = new AbortController();
    const request = window.setTimeout(async () => {
      setIsLoadingOrganizations(true);
      setOrganizationError("");

      try {
        const data = await API.get("/organizations", {
          params: {
            college: formData.college,
            status: "Active",
          },
          signal: controller.signal,
        });
        setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.originalError?.code !== "ERR_CANCELED") {
          setOrganizations([]);
          setOrganizationError(
            err.message || "Unable to load registered organizations.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingOrganizations(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(request);
      controller.abort();
    };
  }, [formData.college]);

  if (!isOpen) return null;

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRoleSelect = (role) => {
    updateForm("role", role);

    if (role === "officer") {
      localStorage.setItem("somis_user_role", "officer");
      if (onOfficerSelect) onOfficerSelect();
      if (onClose) onClose();
    } else if (role === "student") {
      localStorage.setItem("somis_user_role", "student");
      setStep(2);
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();

    const normalizedEmail = formData.officialEmail.trim().toLowerCase();
    const isApprovedEmail = [
      "@marsu.edu.ph",
      "@marstateu.edu.ph",
      "@gmail.com",
    ].some((domain) => normalizedEmail.endsWith(domain));

    if (!isApprovedEmail) {
      const errorMessage =
        "Use your MarSU email (@marsu.edu.ph or @marstateu.edu.ph), or an approved Gmail address.";
      setEmailError(errorMessage);
      showToast(errorMessage, "error");
      return;
    }

    setEmailError("");
    setIsSubmitting(true);

    // Check your backend req.body key expectations against this payload structure
    const payload = {
      firstName: formData.firstName.trim(),
      middleInitial: formData.middleInitial.trim(),
      lastName: formData.lastName.trim(),
      suffix: formData.suffix.trim(),
      studentIdNumber: formData.idNumber.trim(),
      contactNumber: formData.contactNumber.trim(),
      birthDate: formData.birthDate,
      officialEmail: normalizedEmail,
      college: formData.college,
      organizationId: formData.organizationId,
      program: formData.program,
      section: formData.section.trim(),
      yearLevel: formData.yearLevel,
    };

    try {
      await API.post("/auth/register-student", payload);
      showToast("Registration submitted successfully.", "success");
      setStep(4);
    } catch (err) {
      // Log the exact response payload from the backend for debugging
      console.error("400 Error Details:", err.response?.data);

      // Extract error messages from common Express / NestJS / Zod error formats
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.map((e) => e.msg || e.message).join(", ")
          : null) ||
        "Registration failed due to invalid form input or email already exist.";

      const errorMessage =
        typeof backendMessage === "string"
          ? backendMessage
          : JSON.stringify(backendMessage);
      setEmailError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrganization = organizations.find(
    (organization) => organization._id === formData.organizationId,
  );
  const selectedCollege = colleges.find(
    (college) => college.name === formData.college,
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-panel max-w-lg p-5 sm:p-8 space-y-6 transition-all">
        {step < 4 && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-1 bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/20 rounded-full uppercase tracking-wider">
                Step {step} of 3
              </span>
              <span className="text-xs font-bold text-slate-400">
                {step === 1 && "Select Account Type"}
                {step === 2 && "Academic Affiliation"}
                {step === 3 && "Student Details & Registration"}
              </span>
            </div>

            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="text-xs text-slate-500 hover:text-[#4A0E17] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeftIcon />
                <span>Back</span>
              </button>
            ) : (
              onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )
            )}
          </div>
        )}

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#4A0E17]">
                Welcome to SOMIS Portal
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please specify your primary portal role to begin setup.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleRoleSelect("student")}
                className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-[#4A0E17] hover:bg-rose-50/30 transition-all text-left cursor-pointer group"
              >
                <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-[#4A0E17]/10 transition-colors shrink-0">
                  <UserIcon className="w-6 h-6 text-[#4A0E17]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#4A0E17]">
                    Regular Student Member
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    I want to join organizations, attend activities, and track
                    my clearance.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect("officer")}
                className="flex items-start gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-[#D4AF37] hover:bg-amber-50/30 transition-all text-left cursor-pointer group"
              >
                <div className="p-2.5 bg-amber-50 rounded-lg group-hover:bg-[#D4AF37]/20 transition-colors shrink-0">
                  <ShieldCheckIcon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#7A610D]">
                    Student Org Officer / Executive
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    I am managing organization ledgers, rosters, and proposals.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ACADEMIC AFFILIATION */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex p-2 bg-[#4A0E17]/10 rounded-xl mb-1 text-[#4A0E17]">
                <AcademicCapIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-[#4A0E17]">
                Select Academic Affiliation
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select your college and program to route you to the correct
                student organizations.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  College / Campus <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  disabled={isLoadingColleges}
                  value={formData.college}
                  onChange={(e) => {
                    updateForm("college", e.target.value);
                    updateForm("organizationId", "");
                    updateForm("program", "");
                    setOrganizations([]);
                    setOrganizationError("");
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] bg-white font-medium text-slate-800"
                >
                  <option value="" disabled>
                    {isLoadingColleges
                      ? "Loading colleges..."
                      : colleges.length === 0
                        ? "No colleges registered"
                        : "Choose your College..."}
                  </option>
                  {colleges.map((college) => (
                    <option key={college._id} value={college.name}>
                      {college.name} ({college.code})
                    </option>
                  ))}
                </select>
                {collegeError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    {collegeError}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Registered Organization{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  disabled={!formData.college || isLoadingOrganizations}
                  value={formData.organizationId}
                  onChange={(e) => {
                    updateForm("organizationId", e.target.value);
                    updateForm("program", "");
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] bg-white font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="" disabled>
                    {!formData.college
                      ? "Select a College first"
                      : isLoadingOrganizations
                        ? "Loading registered organizations..."
                        : organizations.length === 0
                          ? "No active organization registered for this college"
                          : "Choose your Organization..."}
                  </option>
                  {organizations.map((organization) => (
                    <option key={organization._id} value={organization._id}>
                      {organization.name} ({organization.acronym})
                    </option>
                  ))}
                </select>
                {organizationError ? (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    {organizationError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Only active organizations registered by OVPSAS for your
                    selected college are shown.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Degree Program / Department{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  disabled={!selectedCollege}
                  value={formData.program}
                  onChange={(e) => {
                    const program = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      program,
                      section: applySectionPrefix(
                        prev.section,
                        getSectionPrefix(program, prev.yearLevel),
                      ),
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] bg-white font-medium text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="" disabled>
                    {!selectedCollege
                      ? "Select a College first"
                      : selectedCollege.programs.length === 0
                        ? "No programs registered for this college"
                        : "Choose your Program..."}
                  </option>
                  {selectedCollege?.programs.map((program) => (
                    <option key={program._id} value={program.name}>
                      {program.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Programs are maintained by OVPSAS for the selected college.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student Section <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  placeholder={
                    getSectionPrefix(formData.program, formData.yearLevel) ||
                    "e.g. BSIS - 2 A"
                  }
                  value={formData.section}
                  onChange={(e) => updateForm("section", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] bg-white font-medium text-slate-800 placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter your complete program, year, and block section.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Current Year Level <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.yearLevel}
                  onChange={(e) => {
                    const yearLevel = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      yearLevel,
                      section: applySectionPrefix(
                        prev.section,
                        getSectionPrefix(prev.program, yearLevel),
                      ),
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4A0E17] bg-white font-medium text-slate-800"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year+</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={
                !formData.college ||
                !formData.organizationId ||
                !formData.program ||
                !formData.section.trim() ||
                isLoadingOrganizations ||
                isLoadingColleges
              }
              onClick={() => setStep(3)}
              className="w-full py-2.5 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              Continue to Account Details →
            </button>
          </div>
        )}

        {/* STEP 3: PERSONAL REGISTRATION FORM */}
        {step === 3 && (
          <form onSubmit={handleSubmitRegistration} className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-[#4A0E17]">
                Student Registration
              </h2>
              <p className="text-xs text-slate-500">
                Registering under{" "}
                <strong>
                  {selectedOrganization?.name || "your selected organization"}
                </strong>
                . Provide your official identity details to request an account
                setup link.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan"
                    value={formData.firstName}
                    onChange={(e) => updateForm("firstName", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium text-xs placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    M.I.{" "}
                    <span className="text-slate-400 font-normal">(Opt)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="D."
                    value={formData.middleInitial}
                    onChange={(e) =>
                      updateForm("middleInitial", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium text-xs text-left placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. De La Cruz"
                    value={formData.lastName}
                    onChange={(e) => updateForm("lastName", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium text-xs placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Suffix
                  </label>
                  <input
                    type="text"
                    placeholder="Jr., III"
                    value={formData.suffix}
                    onChange={(e) => updateForm("suffix", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium text-xs placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student ID Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="202645874"
                    value={formData.idNumber}
                    onChange={(e) => updateForm("idNumber", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    autoComplete="tel"
                    placeholder="09XX XXX XXXX"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      updateForm("contactNumber", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium placeholder:text-slate-400 shadow-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Date of Birth <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={TODAY_DATE_STRING}
                    value={formData.birthDate}
                    onChange={(e) => updateForm("birthDate", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Student Email Address{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="student.id@marsu.edu.ph"
                  value={formData.officialEmail}
                  onChange={(e) => {
                    updateForm("officialEmail", e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:border-[#4A0E17] font-medium placeholder:text-slate-400 shadow-sm"
                />
                {emailError ? (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    {emailError}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    We will send an account activation link to this address.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? (
                <span>Sending Setup Link...</span>
              ) : (
                <>
                  <EnvelopeIcon className="w-5 h-5 text-[#D4AF37]" />
                  <span>Send Account Setup Email</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: EMAIL SENT CONFIRMATION SCREEN */}
        {step === 4 && (
          <div className="text-center space-y-5 py-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[#4A0E17]">
                Check Your Email Inbox!
              </h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                We have dispatched an account setup link to:
              </p>
              <p className="text-xs font-bold text-[#4A0E17] bg-rose-50/60 py-1.5 px-3 rounded-lg border border-rose-200/50 inline-block">
                {formData.officialEmail}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-left space-y-2 text-xs">
              <p className="font-bold text-slate-800">
                Organization:{" "}
                {selectedOrganization?.name || "Registered organization"}
              </p>
              <p className="font-bold text-slate-800">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-500 font-medium">
                <li>
                  Open the email from <strong>MarSU SOMIS</strong>.
                </li>
                <li>
                  Click on the <strong>"Set Up Account Password"</strong>{" "}
                  button.
                </li>
                <li>Create your secure account password and sign in.</li>
              </ol>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("somis_user_role", "student");
                localStorage.setItem("somis_onboarding_completed", "true");
                if (onFinish) {
                  onFinish(formData);
                } else if (onClose) {
                  onClose();
                }
              }}
              className="w-full py-2.5 bg-[#4A0E17] hover:bg-[#601520] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Back to Login Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
