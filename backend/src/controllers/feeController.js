const Fee = require("../models/Fee");
const Member = require("../models/MemberOrganization");
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const StudentFeeArchive = require("../models/StudentFeeArchive");
const StudentProfile = require("../models/studentProfile");
const Resolution = require("../models/Resolution");
const {
  getCurrentAcademicPeriod,
  getAcademicPeriodFilter,
} = require("../util/academicPeriod");
const User = require("../models/User");

const TARGET_LEVELS = [
  "All",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year+",
];

const normalizeEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const resolveTargetMembers = async (orgId, targetYearLevel) => {
  const rosterQuery = {
    organization: orgId,
    role: { $nin: ["Faculty Adviser", "Department Dean"] },
  };
  if (targetYearLevel !== "All") rosterQuery.year = targetYearLevel;

  const rosterMembers = await Member.find(rosterQuery)
    .select("idNumber name email year program section role")
    .lean();
  const rosterEmails = rosterMembers.map((member) =>
    normalizeEmail(member.email),
  );
  const linkedUsers = await User.find({
    organization: orgId,
    email: { $in: rosterEmails },
    status: "Active",
  })
    .select("email")
    .lean();
  const usersByEmail = new Map(
    linkedUsers.map((user) => [normalizeEmail(user.email), user]),
  );

  const targetMembers = rosterMembers
    .map((member) => ({
      member: member._id,
      student: usersByEmail.get(normalizeEmail(member.email))?._id || null,
      name: member.name,
      email: member.email,
      studentIdNumber: member.idNumber,
      yearLevel: member.year,
      program: member.program,
      section: member.section,
      role: member.role,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    targetMembers,
    diagnostics: {
      rosterMemberCount: targetMembers.length,
      linkedAccountCount: targetMembers.filter((member) => member.student)
        .length,
      excludedRoleCount: await Member.countDocuments({
        organization: orgId,
        role: { $in: ["Faculty Adviser", "Department Dean"] },
        ...(targetYearLevel === "All" ? {} : { year: targetYearLevel }),
      }),
    },
  };
};

const addCollectionProgress = async (fees) => {
  if (!fees.length) return fees;
  const feeIds = fees.map((fee) => fee._id);
  const payments = await Payment.find({
    fee: { $in: feeIds },
    status: { $in: ["VERIFIED", "PENDING_MANUAL_REVIEW"] },
  })
    .select(
      "fee student member claimedAmount status paymentMethod verifiedAt createdAt",
    )
    .lean();
  const paymentsByFee = new Map();
  payments.forEach((payment) => {
    const key = String(payment.fee);
    if (!paymentsByFee.has(key)) paymentsByFee.set(key, []);
    paymentsByFee.get(key).push(payment);
  });

  return fees.map((feeDocument) => {
    const fee = feeDocument.toObject ? feeDocument.toObject() : feeDocument;
    const feePayments = paymentsByFee.get(String(fee._id)) || [];
    const paymentsByTarget = new Map();
    feePayments.forEach((payment) => {
      if (payment.member) {
        paymentsByTarget.set(`member:${payment.member}`, payment);
      }
      if (payment.student) {
        paymentsByTarget.set(`student:${payment.student}`, payment);
      }
    });
    const verifiedPayments = feePayments.filter(
      (payment) => payment.status === "VERIFIED",
    );
    const collectedAmount = verifiedPayments.reduce(
      (total, payment) => total + Number(payment.claimedAmount || 0),
      0,
    );
    const targetMembers = (fee.targetMembers || []).map((member) => {
      const payment =
        (member.member &&
          paymentsByTarget.get(`member:${String(member.member)}`)) ||
        (member.student &&
          paymentsByTarget.get(`student:${String(member.student)}`));
      return {
        ...member,
        paymentStatus: payment?.status || "UNPAID",
        paymentMethod: payment?.paymentMethod || null,
        paidAt: payment?.verifiedAt || payment?.createdAt || null,
      };
    });
    const targetMemberCount = fee.targetMemberCount || targetMembers.length;
    const expectedCollection =
      fee.expectedCollection || targetMemberCount * Number(fee.amount || 0);

    return {
      ...fee,
      targetMembers,
      targetMemberCount,
      expectedCollection,
      paidMemberCount: verifiedPayments.length,
      pendingMemberCount: feePayments.filter(
        (payment) => payment.status === "PENDING_MANUAL_REVIEW",
      ).length,
      unpaidMemberCount: Math.max(0, targetMemberCount - feePayments.length),
      collectedAmount,
      remainingAmount: Math.max(0, expectedCollection - collectedAmount),
      collectionPercentage:
        expectedCollection > 0
          ? Math.min(
              100,
              Math.round((collectedAmount / expectedCollection) * 100),
            )
          : 0,
    };
  });
};

/**
 * @desc    Create a new Fee Drive
 * @route   POST /api/fees
 * @access  Private (Organization President)
 */
const normalizeFeeFields = (body = {}) => {
  const normalizedTitle = String(body.title || "").trim();
  const numericAmount = Number(body.amount);
  const parsedDueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (
    !normalizedTitle ||
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0 ||
    !body.academicYear ||
    !body.semester ||
    !parsedDueDate ||
    Number.isNaN(parsedDueDate.getTime())
  ) {
    return null;
  }

  const targetYearLevel = String(body.targetYearLevel || "All").trim();
  if (!TARGET_LEVELS.includes(targetYearLevel)) return null;

  return {
    title: normalizedTitle,
    category: String(body.category || "general").trim(),
    amount: numericAmount,
    academicYear: body.academicYear,
    semester: body.semester,
    targetYearLevel,
    dueDate: parsedDueDate,
    description: String(body.description || "").trim(),
  };
};

const archiveExpiredFees = async (orgId) => {
  const now = new Date();
  await Fee.updateMany(
    { org: orgId, status: "active", dueDate: { $lte: now } },
    { $set: { status: "archived" } },
  );
};

/**
 * @desc    Preview all roster members except advisers and deans
 * @route   GET /api/v1/fees/target-preview
 * @access  Private (Organization President)
 */
const previewFeeTargets = async (req, res) => {
  try {
    const targetYearLevel = String(req.query.targetYearLevel || "All").trim();

    if (!TARGET_LEVELS.includes(targetYearLevel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target level.",
      });
    }

    const { targetMembers, diagnostics } = await resolveTargetMembers(
      req.user.organization,
      targetYearLevel,
    );

    return res.status(200).json({
      success: true,
      data: {
        targetYearLevel,
        targetMemberCount: targetMembers.length,
        targetMembers,
        diagnostics,
      },
    });
  } catch (error) {
    console.error("Error previewing fee targets:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch collection targets.",
      error: error.message,
    });
  }
};

const createFee = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      academicYear,
      semester,
      targetYearLevel,
      dueDate,
      description,
    } = req.body;

    const targetOrgId = req.user?.organization;

    if (!targetOrgId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required. Could not associate fee with an organization.",
      });
    }

    const feeFields = normalizeFeeFields({
      title,
      category,
      amount,
      academicYear,
      semester,
      targetYearLevel,
      dueDate,
      description,
    });

    if (!feeFields) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid collection amount, academic details, and due date.",
      });
    }

    // A fee drive must be authorized by an adopted resolution from this org.
    const resolutionId = req.body.resolutionId || req.body.resolution;
    if (!resolutionId) {
      return res.status(409).json({
        success: false,
        message: "A fee drive requires an adopted resolution from this organization.",
      });
    }

    let resolution = null;
    try {
      resolution = await Resolution.findOne({
        _id: resolutionId,
        org: targetOrgId,
      }).select("status resolutionNumber adviserReview");
    } catch (_error) {
      resolution = null;
    }

    if (!resolution) {
      return res.status(404).json({
        success: false,
        message:
          "The selected resolution was not found for this organization.",
      });
    }

    if (resolution.status !== "Adopted") {
      return res.status(409).json({
        success: false,
        message: `Resolution ${
          resolution.resolutionNumber || ""
        } must be adopted before it can fund a fee drive (current status: ${
          resolution.status
        }).`.replace(/\s+/g, " ").trim(),
      });
    }

    // The associated resolution must carry an explicit adviser approval.
    if (resolution.adviserReview?.decision !== "Approved") {
      return res.status(409).json({
        success: false,
        message: `Resolution ${
          resolution.resolutionNumber || ""
        } must be approved by the faculty adviser before it can fund a fee drive.`.replace(
          /\s+/g,
          " ",
        ).trim(),
      });
    }

    const { targetMembers } = await resolveTargetMembers(
      targetOrgId,
      feeFields.targetYearLevel,
    );
    if (targetMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No eligible roster members match the selected target group.",
      });
    }

    // Snapshot the eligible roster members so the collection target stays exact even
    // when the organization roster changes later. The president initiates the
    // collection; the adviser must approve it before it is finalized.
    const newFee = await Fee.create({
      org: targetOrgId,
      ...feeFields,
      resolution: resolution._id,
      targetMembers,
      targetMemberCount: targetMembers.length,
      expectedCollection: targetMembers.length * feeFields.amount,
      approvalStatus: "pending_adviser",
      createdBy: req.user._id,
      status: feeFields.dueDate <= new Date() ? "archived" : "active",
    });
    const [feeWithProgress] = await addCollectionProgress([newFee]);

    res.status(201).json({
      success: true,
      message: `Collection created for ${targetMembers.length} member${targetMembers.length === 1 ? "" : "s"} and submitted for adviser approval.`,
      data: feeWithProgress,
    });
  } catch (error) {
    console.error("Error creating fee record:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not save fee record.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get fees ONLY for the authenticated or specified organization
 * @route   GET /api/fees
 */
const getFees = async (req, res) => {
  try {
    const orgId = req.user?.organization;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization context required to retrieve fees.",
      });
    }

    await archiveExpiredFees(orgId);
    const query = { org: orgId };
    const activePeriod = await getCurrentAcademicPeriod();

    if (
      req.user.role === "treasurer" ||
      req.user.role === "student" ||
      req.user.role === "org_admin" ||
      req.user.role === "adviser"
    ) {
      Object.assign(query, getAcademicPeriodFilter(activePeriod));
    }

    if (
      (req.user.role === "treasurer" ||
        req.user.role === "org_admin" ||
        req.user.role === "adviser") &&
      req.query.includeArchived !== "true"
    ) {
      query.treasurerArchived = { $ne: true };
    }

    // Organization staff can filter by adviser approval state.
    if (
      ["org_admin", "adviser", "treasurer"].includes(req.user.role) &&
      req.query.approvalStatus
    ) {
      query.approvalStatus = String(req.query.approvalStatus);
    }

    if (req.user.role === "student") {
      const studentProfile = await StudentProfile.findOne({
        user: req.user._id,
      }).select("yearLevel");

      query.status = { $in: ["active", "archived"] };
      // Students only see finalized (adviser-approved) collections.
      // `{ $in: ["approved", null] }` keeps legacy fees (no approval field)
      // visible while new collections require explicit adviser approval.
      // Students can no longer hide fees via a personal archive.
      query.approvalStatus = { $in: ["approved", null] };
      query.$or = [
        { "targetMembers.student": req.user._id },
        {
          targetMembers: { $size: 0 },
          targetYearLevel: {
            $in: ["All", studentProfile?.yearLevel].filter(Boolean),
          },
        },
      ];
    }

    const feeQuery = Fee.find(query).sort({ dueDate: 1, createdAt: -1 });
    if (req.user.role === "student") feeQuery.select("-targetMembers");
    const fees = await feeQuery;
    const data = ["treasurer", "org_admin", "adviser"].includes(req.user.role)
      ? await addCollectionProgress(fees)
      : fees;

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching fees:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch fee records.",
      error: error.message,
    });
  }
};

/**
 * Returns clearance fee definitions for the authenticated student, including
 * archived terms. Target rosters are reduced to an applicability flag so no
 * other student's information is exposed.
 */
const getClearanceFees = async (req, res) => {
  try {
    const orgId = req.user?.organization;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization context required to retrieve clearance fees.",
      });
    }

    const studentProfile = await StudentProfile.findOne({
      user: req.user._id,
    })
      .select("studentIdNumber yearLevel")
      .lean();
    const studentEmail = normalizeEmail(req.user.email);
    const studentIdNumber = String(
      studentProfile?.studentIdNumber || "",
    ).trim();
    const fees = await Fee.find({
      org: orgId,
      approvalStatus: { $in: ["approved", null] },
      ...getAcademicPeriodFilter(await getCurrentAcademicPeriod()),
    })
      .select(
        "title category amount academicYear semester status targetYearLevel targetMembers",
      )
      .sort({ createdAt: -1 })
      .lean();

    const data = fees.map((fee) => {
      const hasTargetSnapshot = fee.targetMembers.length > 0;
      const applicableToStudent = hasTargetSnapshot
        ? fee.targetMembers.some(
            (target) =>
              String(target.student || "") === String(req.user._id) ||
              normalizeEmail(target.email) === studentEmail ||
              (studentIdNumber &&
                String(target.studentIdNumber || "").trim() ===
                  studentIdNumber),
          )
        : ["All", studentProfile?.yearLevel]
            .filter(Boolean)
            .includes(fee.targetYearLevel);

      return {
        _id: fee._id,
        title: fee.title,
        category: fee.category,
        amount: fee.amount,
        academicYear: fee.academicYear,
        semester: fee.semester,
        status: fee.status,
        applicableToStudent,
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching student clearance fees:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Could not fetch clearance fee records.",
    });
  }
};

const updateFee = async (req, res) => {
  try {
    const fee = await Fee.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Fee collection not found." });
    }

    if (fee.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Archived or closed fee collections cannot be edited.",
      });
    }

    const feeFields = normalizeFeeFields(req.body);
    if (!feeFields) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid collection amount, academic details, and due date.",
      });
    }

    if (fee.approvalStatus === "approved") {
      return res.status(409).json({
        success: false,
        message:
          "An adviser-approved dues collection cannot be edited. Ask the adviser to reject it first if changes are needed.",
      });
    }

    const existingPayments = await Payment.countDocuments({
      fee: fee._id,
      status: "VERIFIED",
    });
    if (existingPayments > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This fee collection cannot be edited because a student or member has already paid.",
      });
    }

    const targetChanged =
      feeFields.targetYearLevel !== fee.targetYearLevel;
    let targetMembers = fee.targetMembers;
    if (targetChanged || !targetMembers.length) {
      const resolvedTargets = await resolveTargetMembers(
        req.user.organization,
        feeFields.targetYearLevel,
      );
      targetMembers = resolvedTargets.targetMembers;
      if (targetMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No eligible roster members match the selected target group.",
        });
      }
    }

    Object.assign(fee, feeFields, {
      targetMembers,
      targetMemberCount: targetMembers.length,
      expectedCollection: targetMembers.length * feeFields.amount,
      // Editing re-submits the collection for adviser approval.
      approvalStatus: "pending_adviser",
      adviserReview: undefined,
      status: feeFields.dueDate <= new Date() ? "archived" : "active",
    });
    await fee.save();
    const [feeWithProgress] = await addCollectionProgress([fee]);

    res.json({
      success: true,
      message: "Fee collection updated successfully.",
      data: feeWithProgress,
    });
  } catch (error) {
    console.error("Error updating fee record:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not update fee record.",
      error: error.message,
    });
  }
};

const archiveFee = async (req, res) => {
  try {
    const fee = await Fee.findOneAndUpdate(
      {
        _id: req.params.id,
        org: req.user.organization,
        treasurerArchived: { $ne: true },
      },
      { $set: { treasurerArchived: true } },
      { new: true },
    );

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee collection not found or already archived.",
      });
    }

    return res.json({
      success: true,
      message: "Fee collection archived for the organization president.",
      data: fee,
    });
  } catch (error) {
    console.error("Error archiving fee record:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Could not archive fee record.",
      error: error.message,
    });
  }
};

const restoreFee = async (req, res) => {
  const fee = await Fee.findOneAndUpdate(
    { _id: req.params.id, org: req.user.organization, treasurerArchived: true },
    { $set: { treasurerArchived: false } },
    { new: true },
  );
  if (!fee)
    return res
      .status(404)
      .json({ success: false, message: "Archived fee collection not found." });
  return res.json({
    success: true,
    message: "Fee collection restored.",
    data: fee,
  });
};

const deleteFee = async (req, res) => {
  const fee = await Fee.findOne({
    _id: req.params.id,
    org: req.user.organization,
    treasurerArchived: true,
  });
  if (!fee)
    return res
      .status(404)
      .json({ success: false, message: "Archived fee collection not found." });
  await Promise.all([
    Payment.deleteMany({ fee: fee._id }),
    Transaction.deleteMany({ fee: fee._id, organization: fee.org }),
    StudentFeeArchive.deleteMany({ fee: fee._id }),
    Fee.deleteOne({ _id: fee._id }),
  ]);
  return res.json({
    success: true,
    message: "Fee collection permanently deleted.",
  });
};

/**
 * @desc    Adviser approves or rejects a dues collection before it is finalized
 * @route   PATCH /api/fees/:id/review
 * @access  Private (Adviser)
 */
const reviewFee = async (req, res) => {
  const { decision, remarks = "" } = req.body;

  if (!["Approved", "Rejected"].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: "A valid approval decision is required.",
    });
  }

  try {
    const fee = await Fee.findOne({
      _id: req.params.id,
      org: req.user.organization,
    });

    if (!fee) {
      return res
        .status(404)
        .json({ success: false, message: "Fee collection not found." });
    }

    if (fee.approvalStatus !== "pending_adviser") {
      return res.status(409).json({
        success: false,
        message: "This dues collection has already received a final decision.",
      });
    }

    // The associated resolution must itself carry adviser approval.
    if (fee.resolution) {
      const linkedResolution = await Resolution.findOne({
        _id: fee.resolution,
        org: fee.org,
      }).select("status adviserReview resolutionNumber");
      if (!linkedResolution || linkedResolution.status !== "Adopted") {
        return res.status(409).json({
          success: false,
          message:
            "The linked resolution must be adopted before the dues collection can be approved.",
        });
      }
      if (linkedResolution.adviserReview?.decision !== "Approved") {
        return res.status(409).json({
          success: false,
          message:
            "The linked resolution must be approved by the faculty adviser before the dues collection can be approved.",
        });
      }
    }

    fee.approvalStatus =
      decision === "Approved" ? "approved" : "rejected";
    fee.adviserReview = {
      decision,
      remarks: String(remarks).trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };
    await fee.save();
    const [feeWithProgress] = await addCollectionProgress([fee]);

    return res.json({
      success: true,
      message:
        decision === "Approved"
          ? "Dues collection approved and finalized."
          : "Dues collection rejected by the faculty adviser.",
      data: feeWithProgress,
    });
  } catch (error) {
    console.error("Error reviewing fee record:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Could not review fee record.",
      error: error.message,
    });
  }
};

module.exports = {
  createFee,
  previewFeeTargets,
  getFees,
  getClearanceFees,
  updateFee,
  reviewFee,
  archiveFee,
  restoreFee,
  deleteFee,
};
