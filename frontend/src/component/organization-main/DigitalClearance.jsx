import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";
import {
  CLEARANCE_ACADEMIC_YEAR,
  getClearanceSummary,
  normalizeClearanceText,
} from "../../util/clearanceStatus";

const formatStudentName = (profile, membership) => {
  const lastName = profile?.lastName || membership?.surname || "";
  const firstName = profile?.firstName || membership?.firstName || "";
  const middleName = String(
    profile?.middleInitial || membership?.middleInitial || "",
  ).trim();

  if (lastName || firstName) {
    const givenNames = [firstName, middleName].filter(Boolean).join(" ");
    return `${lastName}, ${givenNames}`.trim().toUpperCase();
  }

  return String(membership?.name || "Student name not recorded").toUpperCase();
};

const getProgramSelection = (program) => {
  const normalized = normalizeClearanceText(program);
  return {
    bsis:
      normalized.includes("information systems") ||
      normalized === "bsis" ||
      normalized.startsWith("bsis "),
    bsit:
      normalized.includes("information technology") ||
      normalized === "bsit" ||
      normalized.startsWith("bsit "),
  };
};

const findOfficer = (roster, role) =>
  roster.find(
    (member) =>
      normalizeClearanceText(member.role) === normalizeClearanceText(role),
  )?.name || "";

function SelectionMark({ selected, shape = "square" }) {
  return (
    <span
      className={`inline-grid h-[13px] w-[13px] shrink-0 place-items-center border border-slate-900 ${shape === "circle" ? "rounded-full" : ""}`}
      aria-hidden="true"
    >
      {selected && <Check className="h-[10px] w-[10px] stroke-[3]" />}
    </span>
  );
}

function ProgramOption({ checked, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <SelectionMark selected={checked} />
      <span>{children}</span>
    </span>
  );
}

function SignatureLine({ name, role }) {
  return (
    <div className="min-w-0 text-center">
      <div className="flex min-h-[18px] items-end justify-center border-b border-slate-900 px-1 pb-0.5 text-[10px] font-bold uppercase leading-tight">
        {name || " "}
      </div>
      <p className="mt-1 text-[9px] font-semibold leading-tight text-slate-700">
        {role}
      </p>
    </div>
  );
}

function DocumentHeader({ copyLabel, isCleared, academicYear }) {
  return (
    <>
      <div className="grid grid-cols-[17mm_1fr_17mm] items-center gap-[3mm]">
        <img
          src="/marsu.png"
          alt="Marinduque State University seal"
          className="h-[17mm] w-[17mm] object-contain"
        />
        <div className="min-w-0 text-center font-serif text-slate-950">
          <p className="text-[12px] font-black leading-[1.05]">
            MARINDUQUE STATE UNIVERSITY
          </p>
          <p className="mt-0.5 text-[11px] font-black leading-[1.05]">
            COLLEGE OF INFORMATION AND COMPUTING SCIENCES
          </p>
          <p className="mt-0.5 text-[8px] font-semibold leading-tight">
            Panfilo M. Manguerra Sr. Rd., Tanza, Boac, Marinduque
          </p>
          <p className="mt-0.5 text-[7px] font-bold leading-tight">
            COLLEGE OF INFORMATION AND COMPUTING SCIENCES STUDENT ORGANIZATION -
            BOAC (CICSSO)
          </p>
        </div>
        <img
          src="/cicsso.png"
          alt="CICSSO seal"
          className="h-[17mm] w-[17mm] object-contain"
        />
      </div>

      <div className="relative mt-[2mm] border-y-2 border-[#4A0E17] py-[1.5mm] text-center font-serif">
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[7px] font-bold uppercase text-slate-500">
          {copyLabel}
        </span>
        <h2 className="pr-[22mm] pl-[22mm] text-[19px] font-black leading-none text-slate-950">
          CICSSO ANNUAL CLEARANCE
        </h2>
        <p className="mt-1 text-[11px] font-bold leading-none text-[#4A0E17]">
          S.Y. {academicYear}
        </p>
        {!isCleared && (
          <p className="mt-1 text-[7px] font-black uppercase text-rose-700">
            Preview - requirements incomplete
          </p>
        )}
      </div>
    </>
  );
}

function StudentInformation({ profile, membership }) {
  const program = profile?.program || membership?.program || "";
  const selection = getProgramSelection(program);
  const year = profile?.yearLevel || membership?.year || "Not recorded";
  const section = profile?.section || membership?.section || "Not recorded";
  const studentId =
    profile?.studentIdNumber || membership?.idNumber || "Not recorded";
  const contactNumber =
    profile?.contactNumber || membership?.contactNumber || "Not recorded";

  return (
    <section className="mt-[2mm] font-serif text-[10px] leading-tight text-slate-950">
      <h3 className="border-y border-slate-400 bg-slate-100 py-0.5 text-center text-[10px] font-black">
        STUDENT INFORMATION
      </h3>
      <div className="space-y-[1.5mm] px-[1mm] pt-[1.5mm]">
        <div className="grid grid-cols-[auto_1fr_auto_18mm] items-end gap-1.5">
          <span className="font-bold">Name:</span>
          <span className="min-w-0 border-b border-slate-900 px-1 text-[10px] font-bold">
            {formatStudentName(profile, membership)}
          </span>
          <span className="font-bold">Ext.</span>
          <span className="border-b border-slate-900 px-1 text-center font-bold">
            {profile?.suffix || membership?.suffix || " "}
          </span>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_19mm_auto_27mm] items-end gap-x-1.5 gap-y-1">
          <span className="font-bold">Program:</span>
          <span className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
            <ProgramOption checked={selection.bsis}>
              BS Information Systems
            </ProgramOption>
            <ProgramOption checked={selection.bsit}>
              BS Information Technology
            </ProgramOption>
          </span>
          <span className="font-bold">Year:</span>
          <span className="truncate border-b border-slate-900 px-1 text-center font-bold">
            {year}
          </span>
          <span className="font-bold">Section:</span>
          <span className="truncate border-b border-slate-900 px-1 text-center font-bold">
            {section}
          </span>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_1fr] items-end gap-1.5">
          <span className="font-bold">Student ID #:</span>
          <span className="border-b border-slate-900 px-1 font-bold">
            {studentId}
          </span>
          <span className="font-bold">Contact Number:</span>
          <span className="border-b border-slate-900 px-1 font-bold">
            {contactNumber}
          </span>
        </div>
      </div>
    </section>
  );
}

function RequirementList({ requirements }) {
  return (
    <section className="mt-[2mm] font-serif text-slate-950">
      <h3 className="border-y border-slate-400 bg-slate-100 py-0.5 text-center text-[10px] font-black">
        DUE STATUS
      </h3>
      <div className="mx-auto mt-1 w-[88%] space-y-0.5">
        {requirements.map((requirement) => (
          <div
            key={requirement.id}
            className="grid min-h-[16px] grid-cols-[1fr_auto] items-center gap-3 text-[9px] leading-tight"
          >
            <span className="font-semibold">{requirement.label}</span>
            <span className="flex min-w-[38mm] items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <SelectionMark
                  selected={requirement.status === "Paid"}
                  shape="circle"
                />
                Paid
              </span>
              {requirement.exemptible && (
                <span className="inline-flex items-center gap-1">
                  <SelectionMark selected={requirement.status === "Exempted"} />
                  Exempted
                </span>
              )}
              {!requirement.isSatisfied && (
                <span className="ml-auto font-bold text-rose-700">
                  {requirement.status}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClearanceCopy({
  copyLabel,
  isOfficeCopy,
  isCleared,
  requirements,
  profile,
  membership,
  signatories,
  academicYear,
}) {
  return (
    <section className="min-h-0 px-[3mm] py-[2mm]">
      <DocumentHeader
        copyLabel={copyLabel}
        isCleared={isCleared}
        academicYear={academicYear}
      />
      <StudentInformation profile={profile} membership={membership} />
      <p
        className={`mt-[2mm] border-l-[3px] px-[2mm] py-[1mm] font-serif text-[8px] leading-snug ${
          isCleared
            ? "border-emerald-700 bg-emerald-50 text-slate-800"
            : "border-rose-700 bg-rose-50 text-rose-900"
        }`}
      >
        {isCleared
          ? `This is to certify that the above-mentioned student has complied with the organization fees and fines for the academic year ${academicYear}.`
          : `This preview is not a clearance certification. The student still has incomplete or unverified requirements for the academic year ${academicYear}.`}
      </p>
      <RequirementList requirements={requirements} />

      <section className="mt-[2mm] font-serif text-slate-950">
        <p className="text-[9px] font-black">ATTESTED BY:</p>
        <div className="mt-[2mm] grid grid-cols-2 gap-[10mm] px-[10mm]">
          <SignatureLine name={signatories.treasurer} role="CICSSO Treasurer" />
          <SignatureLine name={signatories.president} role="CICSSO President" />
        </div>
        {isOfficeCopy && (
          <>
            <p className="mt-[2mm] text-[9px] font-black">APPROVED BY:</p>
            <div className="mt-[2mm] grid grid-cols-2 gap-[10mm] px-[10mm]">
              <SignatureLine
                name={signatories.adviser}
                role="Faculty Adviser"
              />
              <SignatureLine
                name={signatories.dean}
                role="College Dean / Program Head"
              />
            </div>
          </>
        )}
      </section>
    </section>
  );
}

function ScreenStatus({
  isLoading,
  isCicsso,
  isCleared,
  satisfiedCount,
  totalCount,
  requirements,
  error,
  downloadError,
  onReviewFees,
  onDownload,
  isDownloading,
  academicYear,
}) {
  const pendingRequirements = requirements.filter(
    (requirement) => !requirement.isSatisfied,
  );

  let icon = <ShieldAlert className="h-5 w-5" aria-hidden="true" />;
  let title = "Clearance not yet available";
  let description = `${satisfiedCount} of ${totalCount} requirements completed.`;
  let tone = "border-amber-300 bg-amber-50 text-amber-950";

  if (isLoading) {
    icon = <Clock3 className="h-5 w-5" aria-hidden="true" />;
    title = "Checking clearance records";
    description = "Loading your profile, organization fees, and payments.";
    tone = "border-slate-300 bg-slate-50 text-slate-800";
  } else if (error) {
    icon = <AlertCircle className="h-5 w-5" aria-hidden="true" />;
    title = "Clearance records are incomplete";
    description = error;
    tone = "border-rose-300 bg-rose-50 text-rose-950";
  } else if (!isCicsso) {
    title = "CICSSO membership required";
    description =
      "This annual clearance is issued to registered CICSSO members.";
    tone = "border-rose-300 bg-rose-50 text-rose-950";
  } else if (isCleared) {
    icon = <CheckCircle2 className="h-5 w-5" aria-hidden="true" />;
    title = `Cleared for S.Y. ${academicYear}`;
    description = "All five CICSSO requirements are verified or exempted.";
    tone = "border-emerald-300 bg-emerald-50 text-emerald-950";
  }

  return (
    <div className="clearance-screen-only space-y-3">
      <div className={`border px-4 py-3 ${tone}`} role="status">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold">{title}</h3>
              <p className="mt-0.5 text-xs leading-5 opacity-80">
                {description}
              </p>
              {!isLoading && isCicsso && pendingRequirements.length > 0 && (
                <p className="mt-1 text-[11px] font-semibold opacity-80">
                  Pending:{" "}
                  {pendingRequirements.map((item) => item.label).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            {!isCleared && isCicsso && onReviewFees && (
              <button
                type="button"
                onClick={onReviewFees}
                className="inline-flex min-h-10 items-center justify-center border border-current bg-white/70 px-3 text-xs font-bold hover:bg-white"
              >
                Review fees
              </button>
            )}
            <button
              type="button"
              onClick={onDownload}
              disabled={!isCicsso || isLoading || isDownloading}
              title={
                isCleared
                  ? "Download your clearance as an A4 PDF"
                  : "Download your current clearance progress as an A4 PDF"
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#4A0E17] px-3 text-xs font-bold text-white hover:bg-[#36080E] disabled:bg-slate-300 disabled:text-slate-600"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isDownloading
                ? "Preparing PDF..."
                : isCleared
                  ? "Download PDF"
                  : "Download progress PDF"}
            </button>
          </div>
        </div>
      </div>

      {downloadError && (
        <div
          className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
          role="alert"
        >
          {downloadError}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-[#4A0E17]" aria-hidden="true" />
          <span className="font-bold text-slate-700">
            Digital clearance preview
          </span>
        </div>
        <span className="font-semibold">
          {satisfiedCount}/{totalCount} complete
        </span>
      </div>
      <div className="h-1.5 overflow-hidden bg-slate-200" aria-hidden="true">
        <div
          className="h-full bg-emerald-700 transition-[width]"
          style={{ width: `${(satisfiedCount / totalCount) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function DigitalClearance({
  organization,
  membership,
  studentProfile,
  roster = [],
  fees = [],
  payments = [],
  academicYear = CLEARANCE_ACADEMIC_YEAR,
  isLoading = false,
  feeError = "",
  paymentError = "",
  onReviewFees,
}) {
  const paperScrollRef = useRef(null);
  const paperRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const { requirements, satisfiedCount, isCicsso, isCleared } =
    getClearanceSummary(organization, fees, payments, academicYear);
  const signatories = {
    treasurer: findOfficer(roster, "Treasurer"),
    president: organization?.president || findOfficer(roster, "President"),
    adviser: organization?.adviser || findOfficer(roster, "Faculty Adviser"),
    dean: findOfficer(roster, "Department Dean"),
  };
  const dataError = [feeError, paymentError].filter(Boolean).join(" ");

  useEffect(() => {
    const container = paperScrollRef.current;
    if (!container || typeof ResizeObserver === "undefined") return undefined;

    const paperWidthPx = (210 / 25.4) * 96;
    const updateScale = () => {
      const availableWidth = container.clientWidth;
      setPreviewScale(Math.min(1, availableWidth / paperWidthPx));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    updateScale();

    return () => observer.disconnect();
  }, []);

  const paperWidthPx = (210 / 25.4) * 96;
  const paperHeightPx = (297 / 25.4) * 96;

  const handleDownloadPdf = async () => {
    const paper = paperRef.current;
    if (!paper || !isCicsso || isLoading || isDownloading) return;

    setIsDownloading(true);
    setDownloadError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      paper.classList.add("clearance-pdf-capture");
      const canvas = await html2canvas(paper, {
        backgroundColor: "#fffefb",
        scale: 2,
        useCORS: true,
        logging: false,
        width: paperWidthPx,
        height: paperHeightPx,
      });
      paper.classList.remove("clearance-pdf-capture");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.96),
        "JPEG",
        0,
        0,
        210,
        297,
      );
      const studentId = String(
        studentProfile?.studentIdNumber || membership?.idNumber || "student",
      )
        .trim()
        .replace(/[^a-z0-9-]+/gi, "-");
      const fileAcademicYear = academicYear.replace(/\s+/g, "");
      const documentType = isCleared ? "Clearance" : "Clearance-Progress";
      pdf.save(
        `CICSSO-${documentType}-${studentId || "student"}-${fileAcademicYear}.pdf`,
      );
    } catch (error) {
      console.error("Unable to generate clearance PDF:", error);
      setDownloadError(
        "Unable to generate the PDF. Please wait for the preview to load, then try again.",
      );
    } finally {
      paper.classList.remove("clearance-pdf-capture");
      setIsDownloading(false);
    }
  };

  return (
    <div className="clearance-print-root space-y-4">
      <ScreenStatus
        isLoading={isLoading}
        academicYear={academicYear}
        isCicsso={isCicsso}
        isCleared={isCleared}
        satisfiedCount={satisfiedCount}
        totalCount={requirements.length}
        requirements={requirements}
        error={dataError}
        downloadError={downloadError}
        onReviewFees={onReviewFees}
        onDownload={handleDownloadPdf}
        isDownloading={isDownloading}
      />

      <div
        ref={paperScrollRef}
        className="clearance-paper-scroll w-full overflow-hidden pb-4"
      >
        <div
          className="clearance-paper-stage relative mx-auto"
          style={{
            width: `${paperWidthPx * previewScale}px`,
            height: `${paperHeightPx * previewScale}px`,
          }}
        >
          <article
            ref={paperRef}
            className="clearance-paper absolute left-0 top-0 grid h-[297mm] min-h-[297mm] w-[210mm] min-w-[210mm] origin-top-left grid-rows-[1fr_auto_1fr] overflow-hidden border border-slate-300 bg-[#fffefb] p-[8mm] text-slate-950 shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
            style={{
              transform: `scale(${previewScale})`,
              "--clearance-preview-scale": previewScale,
            }}
            aria-label="CICSSO annual clearance document preview"
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.018] [background-image:radial-gradient(#4A0E17_0.5px,transparent_0.5px)] [background-size:4px_4px]" />
            <ClearanceCopy
              copyLabel="Student copy"
              isOfficeCopy={false}
              isCleared={isCleared}
              requirements={requirements}
              profile={studentProfile}
              membership={membership}
              signatories={signatories}
              academicYear={academicYear}
            />

            <div
              className="relative my-[2mm] flex h-[7mm] items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-dashed border-slate-500" />
              <span className="absolute left-0 bg-[#fffefb] pr-2 font-serif text-[8px] font-bold uppercase text-slate-500">
                Cut along line
              </span>
            </div>

            <ClearanceCopy
              copyLabel="CICSSO copy"
              isOfficeCopy={true}
              isCleared={isCleared}
              requirements={requirements}
              profile={studentProfile}
              membership={membership}
              signatories={signatories}
              academicYear={academicYear}
            />
          </article>
        </div>
      </div>
    </div>
  );
}
