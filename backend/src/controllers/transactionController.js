const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const { saveReceipt, getPublicReceiptUrl } = require("./receiptController");
const {
  getCurrentAcademicPeriod,
  getAcademicPeriodFilter,
  getAcademicPeriodDateRange,
} = require("../util/academicPeriod");

const normalizeTransaction = (body = {}) => {
  const title = String(body.title || "").trim();
  const type = String(body.type || "")
    .trim()
    .toLowerCase();
  const category = String(body.category || "").trim();
  const amount = Number(body.amount);
  const date = new Date(body.date);

  if (
    !title ||
    !["income", "expense"].includes(type) ||
    !category ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !body.date ||
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  const feeId = body.feeId || body.fee;
  const fundingFeeId = body.fundingFeeId || body.fundingFee;
  if (
    (type === "income" &&
      !mongoose.Types.ObjectId.isValid(String(feeId || ""))) ||
    (type === "expense" &&
      !mongoose.Types.ObjectId.isValid(String(fundingFeeId || "")))
  ) {
    return null;
  }

  return {
    title,
    type,
    category,
    amount,
    feeId: type === "income" ? feeId : null,
    fundingFeeId: type === "expense" ? fundingFeeId : null,
    date,
    reference: String(body.reference || "").trim(),
    status: type === "income" ? "Approved" : "Pending",
  };
};

const listTransactions = async (req, res) => {
  try {
    const period = await getCurrentAcademicPeriod();
    const legacyRange = getAcademicPeriodDateRange(period);
    const periodFilter = getAcademicPeriodFilter(period);
    const transactions = await Transaction.find({
      organization: req.user.organization,
      $or: [
        periodFilter,
        ...(legacyRange
          ? [
              {
                academicYear: { $exists: false },
                date: { $gte: legacyRange.start, $lt: legacyRange.end },
              },
            ]
          : []),
      ],
    })
      .populate("fee", "title amount baseCost marginPerMember status")
      .populate("fundingFee", "title amount status")
      .populate("reviewedBy", "name role")
      .sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Treasury transaction retrieval failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve treasury transactions.",
    });
  }
};

const createTransaction = async (req, res) => {
  const fields = normalizeTransaction(req.body);
  if (!fields) {
    return res.status(400).json({
      success: false,
      message:
        "Provide a title, valid type, category, amount, date, and a valid dues collection.",
    });
  }

  try {
    const period = await getCurrentAcademicPeriod();
    let collectionFields = {};

    if (fields.type === "expense" && !req.file) {
      return res.status(400).json({
        success: false,
        message: "A receipt image is required for expense entries.",
      });
    }

    if (fields.type === "income") {
      const fee = await Fee.findOne({
        _id: fields.feeId,
        org: req.user.organization,
        ...getAcademicPeriodFilter(period),
        status: "active",
      }).select("title amount baseCost marginPerMember");

      if (!fee) {
        return res.status(404).json({
          success: false,
          message: "The selected active dues collection was not found.",
        });
      }

      const [paymentTotals, postedTotals] = await Promise.all([
        Payment.aggregate([
          {
            $match: {
              organization: req.user.organization,
              fee: fee._id,
              status: "VERIFIED",
            },
          },
          { $group: { _id: null, total: { $sum: "$claimedAmount" } } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              organization: req.user.organization,
              fee: fee._id,
              ...getAcademicPeriodFilter(period),
              type: "income",
              status: "Approved",
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      const verifiedAmount = Number(paymentTotals[0]?.total || 0);
      const alreadyPosted = Number(postedTotals[0]?.total || 0);
      const availableAmount = Math.max(0, verifiedAmount - alreadyPosted);

      if (fields.amount > availableAmount) {
        return res.status(409).json({
          success: false,
          message: `Only ₱${availableAmount.toFixed(2)} of verified collection income remains unposted.`,
        });
      }

      const unitPrice = Number(fee.amount || 0);
      const baseCost = Number(fee.baseCost || 0);
      const estimatedCost =
        unitPrice > 0 ? (fields.amount / unitPrice) * baseCost : 0;
      collectionFields = {
        fee: fee._id,
        unitPriceSnapshot: unitPrice,
        baseCostSnapshot: baseCost,
        estimatedCost,
        netIncome: fields.amount - estimatedCost,
      };
    } else {
      const fundingFee = await Fee.findOne({
        _id: fields.fundingFeeId,
        org: req.user.organization,
        ...getAcademicPeriodFilter(period),
      }).select("title");

      if (!fundingFee) {
        return res.status(404).json({
          success: false,
          message: "The selected dues collection funding source was not found.",
        });
      }

      const [paymentTotals, expenseTotals] = await Promise.all([
        Payment.aggregate([
          {
            $match: {
              organization: req.user.organization,
              fee: fundingFee._id,
              status: "VERIFIED",
            },
          },
          { $group: { _id: null, total: { $sum: "$claimedAmount" } } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              organization: req.user.organization,
              fundingFee: fundingFee._id,
              ...getAcademicPeriodFilter(period),
              type: "expense",
              status: { $ne: "Rejected" },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);
      const verifiedAmount = Number(paymentTotals[0]?.total || 0);
      const alreadyAllocated = Number(expenseTotals[0]?.total || 0);
      const availableAmount = Math.max(0, verifiedAmount - alreadyAllocated);

      if (fields.amount > availableAmount) {
        return res.status(409).json({
          success: false,
          message: `Only ₱${availableAmount.toFixed(2)} remains available from the selected dues collection.`,
        });
      }

      let receiptImageUrl;
      try {
        const relativeReceiptUrl = await saveReceipt(req.file);
        receiptImageUrl = getPublicReceiptUrl(req, relativeReceiptUrl);
      } catch (error) {
        console.error("Expense receipt storage failed:", error);
        return res.status(500).json({
          success: false,
          message: "Unable to store the expense receipt image.",
        });
      }

      collectionFields = {
        fundingFee: fundingFee._id,
        receiptImageUrl,
      };
    }

    const { feeId, fundingFeeId, ...transactionFields } = fields;
    const transaction = await Transaction.create({
      ...transactionFields,
      ...collectionFields,
      ...getAcademicPeriodFilter(period),
      organization: req.user.organization,
      createdBy: req.user._id,
    });
    await Promise.all([
      transaction.populate(
        "fee",
        "title amount baseCost marginPerMember status",
      ),
      transaction.populate("fundingFee", "title amount status"),
    ]);

    return res.status(201).json({
      success: true,
      message: "Treasury transaction recorded successfully.",
      data: transaction,
    });
  } catch (error) {
    console.error("Treasury transaction creation failed:", error);
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((validationError) => validationError.message)
          .join(" "),
      });
    }
    return res.status(500).json({
      success: false,
      message: "Unable to record the treasury transaction.",
    });
  }
};

const reviewExpenseTransaction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id || ""))) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction identifier.",
      });
    }

    const decision = String(req.body?.decision || "")
      .trim()
      .toLowerCase();
    const reviewRemarks = String(req.body?.remarks || "").trim();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Choose either approve or reject.",
      });
    }
    if (decision === "reject" && !reviewRemarks) {
      return res.status(400).json({
        success: false,
        message: "Provide a reason for rejecting this expense.",
      });
    }
    if (reviewRemarks.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Review remarks must not exceed 500 characters.",
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Expense transaction not found for your organization.",
      });
    }
    if (transaction.type !== "expense") {
      return res.status(400).json({
        success: false,
        message: "Only expense transactions require approval or rejection.",
      });
    }
    if (transaction.status !== "Pending") {
      return res.status(409).json({
        success: false,
        message: `This expense was already ${transaction.status.toLowerCase()}.`,
      });
    }

    transaction.status = decision === "approve" ? "Approved" : "Rejected";
    transaction.reviewRemarks = reviewRemarks;
    transaction.reviewedAt = new Date();
    transaction.reviewedBy = req.user._id;
    await transaction.save();
    await Promise.all([
      transaction.populate("fundingFee", "title amount status"),
      transaction.populate("reviewedBy", "name role"),
    ]);

    return res.json({
      success: true,
      message: `Expense ${transaction.status.toLowerCase()} successfully.`,
      data: transaction,
    });
  } catch (error) {
    console.error("Expense transaction review failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to review the expense transaction.",
    });
  }
};

module.exports = {
  listTransactions,
  createTransaction,
  reviewExpenseTransaction,
};
