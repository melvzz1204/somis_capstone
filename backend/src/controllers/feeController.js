const Fee = require("../models/Fee");

/**
 * @desc    Create a new Fee Drive
 * @route   POST /api/fees
 * @access  Private (Secretary / Admin)
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
      org, // Sent from frontend payload or extracted from auth token
    } = req.body;

    // Determine target Org ID (Auth middleware req.user preferred, fallback to req.body)
    const targetOrgId = req.user?.orgId || req.user?.org || org;

    if (!targetOrgId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required. Could not associate fee with an organization.",
      });
    }

    if (!title || !amount || !academicYear || !semester || !dueDate) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill in all required fields (title, amount, academicYear, semester, dueDate).",
      });
    }

    // Create org-scoped fee document
    const newFee = await Fee.create({
      org: targetOrgId,
      title,
      category,
      amount,
      academicYear,
      semester,
      targetYearLevel,
      dueDate,
      description,
      createdBy: req.user?._id,
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
    // Filter strictly by organization
    const orgId = req.user?.orgId || req.user?.org || req.query.org;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization context required to retrieve fees.",
      });
    }

    const fees = await Fee.find({ org: orgId }).sort({ createdAt: -1 });

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
