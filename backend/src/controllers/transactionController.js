const Transaction = require("../models/Transaction");

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

  return {
    title,
    type,
    category,
    amount,
    date,
    reference: String(body.reference || "").trim(),
    status: type === "income" ? "Approved" : "Pending",
  };
};

const listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      organization: req.user.organization,
    }).sort({ date: -1, createdAt: -1 });

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
      message: "Provide a title, valid type, category, amount, and date.",
    });
  }

  try {
    const transaction = await Transaction.create({
      ...fields,
      organization: req.user.organization,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Treasury transaction recorded successfully.",
      data: transaction,
    });
  } catch (error) {
    console.error("Treasury transaction creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to record the treasury transaction.",
    });
  }
};

module.exports = { listTransactions, createTransaction };
