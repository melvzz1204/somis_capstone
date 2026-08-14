const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
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

const getTargetMembers = async (orgId, targetYearLevel) => {
  const profileQuery = { organization: orgId };
  if (targetYearLevel !== "All") profileQuery.yearLevel = targetYearLevel;

  const profiles = await StudentProfile.find(profileQuery)
    .select("user studentIdNumber yearLevel program section firstName lastName")
    .lean();
  const activeStudents = await User.find({
    _id: { $in: profiles.map((profile) => profile.user) },
    organization: orgId,
    role: "student",
    status: "Active",
  })
    .select("name email")
    .lean();
  const usersById = new Map(
    activeStudents.map((student) => [String(student._id), student]),
  );

  return profiles
    .map((profile) => {
      const student = usersById.get(String(profile.user));
      if (!student) return null;
      return {
        student: student._id,
        name: student.name || `${profile.firstName} ${profile.lastName}`.trim(),
        email: student.email,
        studentIdNumber: profile.studentIdNumber,
        yearLevel: profile.yearLevel,
        program: profile.program,
        section: profile.section,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
};

const addCollectionProgress = async (fees) => {
  if (!fees.length) return fees;
  const feeIds = fees.map((fee) => fee._id);
  const payments = await Payment.find({
    fee: { $in: feeIds },
    status: { $in: ["VERIFIED", "PENDING_MANUAL_REVIEW"] },
  })
    .select(
      "fee student claimedAmount status paymentMethod verifiedAt createdAt",
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
    const paymentByStudent = new Map(
      feePayments.map((payment) => [String(payment.student), payment]),
    );
    const verifiedPayments = feePayments.filter(
      (payment) => payment.status === "VERIFIED",
    );
    const collectedAmount = verifiedPayments.reduce(
      (total, payment) => total + Number(payment.claimedAmount || 0),
      0,
    );
    const targetMembers = (fee.targetMembers || []).map((member) => {
      const payment = paymentByStudent.get(String(member.student));
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
 * @desc    Preview the exact active students that will be snapshotted
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

    const targetMembers = await getTargetMembers(
      req.user.organization,
      targetYearLevel,
    );

    return res.status(200).json({
      success: true,
      data: {
        targetYearLevel,
        targetMemberCount: targetMembers.length,
        targetMembers,
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

    const targetMembers = await getTargetMembers(
      targetOrgId,
      feeFields.targetYearLevel,
    );
    if (targetMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active student accounts match the selected target group.",
      });
    }

    // Snapshot the eligible students so the collection target stays exact even
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
      message: `Collection created for ${targetMembers.length} student${targetMembers.length === 1 ? "" : "s"}.`,
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

    if (req.user.role === "student") {
      const studentProfile = await StudentProfile.findOne({
        user: req.user._id,
      }).select("yearLevel");

      query.status = "active";
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

    const existingPayments = await Payment.countDocuments({ fee: fee._id });
    const targetChanged = fee.targetYearLevel !== feeFields.targetYearLevel;
    const amountChanged = Number(fee.amount) !== Number(feeFields.amount);
    const baseCostChanged = Number(fee.baseCost || 0) !== feeFields.baseCost;
    if (
      existingPayments > 0 &&
      (targetChanged || amountChanged || baseCostChanged)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Pricing and target group cannot be changed after a payment has been submitted.",
      });
    }

    let targetMembers = fee.targetMembers;
    if (targetChanged || !targetMembers.length) {
      targetMembers = await getTargetMembers(
        req.user.organization,
        feeFields.targetYearLevel,
      );
      if (targetMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No active student accounts match the selected target group.",
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
      { _id: req.params.id, org: req.user.organization, status: "active" },
      { $set: { status: "archived" } },
      { new: true },
    );

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Active fee collection not found.",
      });
    }

    res.json({
      success: true,
      message: "Fee collection archived successfully.",
      data: fee,
    });
  } catch (error) {
    console.error("Error archiving fee record:", error);
    res.status(500).json({
      success: false,
      message: "Server Error: Could not archive fee record.",
      error: error.message,
    });
  }
};

module.exports = {
  createFee,
  previewFeeTargets,
  getFees,
  updateFee,
  archiveFee,
};
