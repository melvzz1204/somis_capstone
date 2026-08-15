const Fee = require("../models/Fee");
const Member = require("../models/MemberOrganization");
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const StudentFeeArchive = require("../models/StudentFeeArchive");
const StudentProfile = require("../models/studentProfile");
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
 * @access  Private (Treasurer)
 */
const normalizeFeeFields = (body = {}) => {
  const normalizedTitle = String(body.title || "").trim();
  const numericAmount = Number(body.amount);
  const numericBaseCost = Number(body.baseCost || 0);
  const parsedDueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (
    !normalizedTitle ||
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0 ||
    !Number.isFinite(numericBaseCost) ||
    numericBaseCost < 0 ||
    numericBaseCost > numericAmount ||
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
    baseCost: numericBaseCost,
    marginPerMember: numericAmount - numericBaseCost,
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
 * @access  Private (Treasurer)
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
      baseCost,
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
      baseCost,
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
          "Provide valid collection pricing (base cost cannot exceed the collection amount), academic details, and due date.",
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
    // when the organization roster changes later.
    const newFee = await Fee.create({
      org: targetOrgId,
      ...feeFields,
      targetMembers,
      targetMemberCount: targetMembers.length,
      expectedCollection: targetMembers.length * feeFields.amount,
      expectedCost: targetMembers.length * feeFields.baseCost,
      expectedMargin: targetMembers.length * feeFields.marginPerMember,
      createdBy: req.user._id,
      status: feeFields.dueDate <= new Date() ? "archived" : "active",
    });
    const [feeWithProgress] = await addCollectionProgress([newFee]);

    res.status(201).json({
      success: true,
      message: `Collection created for ${targetMembers.length} member${targetMembers.length === 1 ? "" : "s"}.`,
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

    if (req.user.role === "treasurer" && req.query.includeArchived !== "true") {
      query.treasurerArchived = { $ne: true };
    }

    if (req.user.role === "student") {
      const studentProfile = await StudentProfile.findOne({
        user: req.user._id,
      }).select("yearLevel");

      const hiddenArchives = await StudentFeeArchive.find({
        student: req.user._id,
        organization: orgId,
        state: { $in: ["archived", "deleted"] },
      })
        .select("fee")
        .lean();
      const hiddenFeeIds = hiddenArchives.map((archive) => archive.fee);

      query.status = { $in: ["active", "archived"] };
      if (hiddenFeeIds.length) query._id = { $nin: hiddenFeeIds };
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
    const data =
      req.user.role === "treasurer" ? await addCollectionProgress(fees) : fees;

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
    const fees = await Fee.find({ org: orgId })
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
          "Provide valid collection pricing (base cost cannot exceed the collection amount), academic details, and due date.",
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
      expectedCost: targetMembers.length * feeFields.baseCost,
      expectedMargin: targetMembers.length * feeFields.marginPerMember,
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
      message: "Fee collection archived for the treasurer.",
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

const archiveStudentFee = async (req, res) => {
  const fee = await Fee.findOne({
    _id: req.params.id,
    org: req.user.organization,
    status: { $in: ["active", "archived"] },
  });
  if (!fee)
    return res.status(404).json({
      success: false,
      message: "Applicable fee collection not found.",
    });
  const target = fee.targetMembers.find(
    (member) => String(member.student || "") === String(req.user._id),
  );
  if (!target && fee.targetMembers.length)
    return res
      .status(403)
      .json({ success: false, message: "This fee is not applicable to you." });
  const archive = await StudentFeeArchive.findOneAndUpdate(
    { student: req.user._id, fee: fee._id },
    { organization: fee.org, state: "archived" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return res.json({
    success: true,
    message: "Fee moved to your archive.",
    data: archive,
  });
};

const restoreStudentFee = async (req, res) => {
  const archive = await StudentFeeArchive.findOneAndUpdate(
    {
      student: req.user._id,
      fee: req.params.id,
      state: "archived",
    },
    { $set: { state: "archived" } },
    { new: true },
  );
  if (!archive)
    return res
      .status(404)
      .json({ success: false, message: "Student fee archive not found." });
  await StudentFeeArchive.deleteOne({ _id: archive._id });
  return res.json({
    success: true,
    message: "Fee restored to your active list.",
  });
};

const deleteStudentFee = async (req, res) => {
  const archive = await StudentFeeArchive.findOneAndUpdate(
    { student: req.user._id, fee: req.params.id },
    { organization: req.user.organization, state: "deleted" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return res.json({
    success: true,
    message: "Fee permanently removed from your archive.",
    data: archive,
  });
};

const listStudentFeeArchive = async (req, res) => {
  const archives = await StudentFeeArchive.find({
    student: req.user._id,
    organization: req.user.organization,
    state: "archived",
  })
    .populate(
      "fee",
      "title category amount academicYear semester dueDate status treasurerArchived",
    )
    .sort({ updatedAt: -1 });
  return res.json({ success: true, count: archives.length, data: archives });
};

module.exports = {
  createFee,
  previewFeeTargets,
  getFees,
  getClearanceFees,
  updateFee,
  archiveFee,
  restoreFee,
  deleteFee,
  archiveStudentFee,
  restoreStudentFee,
  deleteStudentFee,
  listStudentFeeArchive,
};
