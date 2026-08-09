const Fee = require("../models/Fee");

/**
 * @desc    Create a new Fee Drive
 * @route   POST /api/fees
 * @access  Private (Treasurer)
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

  return {
    title: normalizedTitle,
    category: String(body.category || "general").trim(),
    amount: numericAmount,
    academicYear: body.academicYear,
    semester: body.semester,
    targetYearLevel: body.targetYearLevel || "All",
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
          "Provide a fee title, a positive amount, academic year, semester, and valid due date.",
      });
    }

    // Create an organization-scoped fee using the authenticated treasurer only.
    const newFee = await Fee.create({
      org: targetOrgId,
      ...feeFields,
      createdBy: req.user._id,
      status: feeFields.dueDate <= new Date() ? "archived" : "active",
    });

    res.status(201).json({
      success: true,
      message: "Fee drive created successfully!",
      data: newFee,
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
      const StudentProfile = require("../models/studentProfile");
      const studentProfile = await StudentProfile.findOne({
        user: req.user._id,
      }).select("yearLevel");

      query.status = "active";
      if (studentProfile?.yearLevel) {
        query.targetYearLevel = {
          $in: ["All", studentProfile.yearLevel],
        };
      }
    }

    const fees = await Fee.find(query).sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: fees.length,
      data: fees,
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
          "Provide a fee title, a positive amount, academic year, semester, and valid due date.",
      });
    }

    Object.assign(fee, feeFields, {
      status: feeFields.dueDate <= new Date() ? "archived" : "active",
    });
    await fee.save();

    res.json({
      success: true,
      message: "Fee collection updated successfully.",
      data: fee,
    });
  } catch (error) {
    console.error("Error updating fee record:", error);
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
        success: false,
        message: "Server Error: Could not archive fee record.",
        error: error.message,
      });
  }
};

module.exports = {
  createFee,
  getFees,
  updateFee,
  archiveFee,
};
