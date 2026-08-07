const Fee = require("../models/Fee");

/**
 * @desc    Create a new Fee Drive
 * @route   POST /api/fees
 * @access  Private (Treasurer)
 */
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

    const normalizedTitle = String(title || "").trim();
    const numericAmount = Number(amount);
    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    if (
      !normalizedTitle ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !academicYear ||
      !semester ||
      !parsedDueDate ||
      Number.isNaN(parsedDueDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a fee title, a positive amount, academic year, semester, and valid due date.",
      });
    }

    // Create an organization-scoped fee using the authenticated treasurer only.
    const newFee = await Fee.create({
      org: targetOrgId,
      title: normalizedTitle,
      category: String(category || "general").trim(),
      amount: numericAmount,
      academicYear,
      semester,
      targetYearLevel: targetYearLevel || "All",
      dueDate: parsedDueDate,
      description: String(description || "").trim(),
      createdBy: req.user._id,
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

module.exports = {
  createFee,
  getFees,
};
