const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");

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
  if (
    type === "income" &&
    !mongoose.Types.ObjectId.isValid(String(feeId || ""))
  ) {
    return null;
  }

  return {
    title,
    type,
    category,
    amount,
    feeId: type === "income" ? feeId : null,
    date,
    reference: String(body.reference || "").trim(),
    status: type === "income" ? "Approved" : "Pending",
  };
};

const listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      organization: req.user.organization,
    })
      .populate("fee", "title amount baseCost marginPerMember status")
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
        "Provide a title, valid type, category, amount, date, and an active dues collection for income entries.",
    });
  }

  try {
    let collectionFields = {};

    if (fields.type === "income") {
      const fee = await Fee.findOne({
        _id: fields.feeId,
        org: req.user.organization,
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
    }

    const { feeId, ...transactionFields } = fields;
    const transaction = await Transaction.create({
      ...transactionFields,
      ...collectionFields,
      organization: req.user.organization,
      createdBy: req.user._id,
    });
    await transaction.populate(
      "fee",
      "title amount baseCost marginPerMember status",
    );

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

module.exports = { listTransactions, createTransaction };
