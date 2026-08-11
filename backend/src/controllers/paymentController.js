const mongoose = require("mongoose");
const { createWorker } = require("tesseract.js");
const { PDFParse, PasswordException } = require("pdf-parse");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const {
  PAYMENT_STATUSES,
  normalizeReferenceNumber,
} = require("../models/Payment");

const PAYMENT_PUBLIC_FIELDS =
  "student organization fee event claimedAmount extractedAmount referenceNumber receiptImageUrl status failureReason verificationMethod verifiedAt createdAt updatedAt";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const isObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value ?? ""));

/**
 * Submits a GCash reference against an organization fee.
 * Amount and organization are always derived from the server-side fee record.
 *
 * @route POST /api/v1/payments
 * @access Student
 */
const createPayment = async (req, res) => {
  const feeId = req.body?.feeId;
  const referenceNumber = normalizeReferenceNumber(req.body?.referenceNumber);
  const receiptImageUrl = String(req.body?.receiptImageUrl || "").trim();
  const ocrRawText = String(req.body?.ocrRawText || "").trim();
  const extractedAmount = Number(req.body?.extractedAmount);
  const hasReceiptMetadata = Boolean(receiptImageUrl && ocrRawText);

  if (!isObjectId(feeId) || !/^\d{13}$/.test(referenceNumber)) {
    return res.status(400).json({
      success: false,
      message:
        "Provide a valid fee and the 13-digit GCash reference number extracted from the receipt.",
    });
  }

  try {
    const fee = await Fee.findOne({
      _id: feeId,
      org: req.user.organization,
      status: "active",
    }).select("org amount title");

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "The selected active fee was not found for your organization.",
      });
    }

    const existingFeePayment = await Payment.findOne({
      student: req.user._id,
      fee: fee._id,
      status: { $in: ["PENDING_MANUAL_REVIEW", "VERIFIED"] },
    })
      .select(PAYMENT_PUBLIC_FIELDS)
      .populate("fee", "title dueDate academicYear semester");

    if (
      existingFeePayment?.status === "VERIFIED" ||
      (existingFeePayment && !hasReceiptMetadata)
    ) {
      return res.status(409).json({
        success: false,
        message:
          existingFeePayment.status === "VERIFIED"
            ? "This fee has already been paid and verified."
            : "You already have an active payment submission for this fee.",
        data: existingFeePayment,
      });
    }

    if (existingFeePayment) {
      existingFeePayment.set({
        referenceNumber,
        claimedAmount: fee.amount,
        extractedAmount:
          Number.isFinite(extractedAmount) && extractedAmount >= 0
            ? extractedAmount
            : undefined,
        receiptImageUrl,
        ocrRawText,
        verificationMethod: "OCR",
        failureReason: undefined,
        verifiedAt: undefined,
      });
      await existingFeePayment.save();
      await existingFeePayment.populate(
        "fee",
        "title dueDate academicYear semester",
      );

      return res.status(200).json({
        success: true,
        message: "Pending payment updated with the uploaded GCash receipt.",
        data: existingFeePayment,
      });
    }

    const payment = await Payment.create({
      student: req.user._id,
      organization: fee.org,
      fee: fee._id,
      claimedAmount: fee.amount,
      extractedAmount:
        Number.isFinite(extractedAmount) && extractedAmount >= 0
          ? extractedAmount
          : undefined,
      referenceNumber,
      receiptImageUrl: hasReceiptMetadata ? receiptImageUrl : undefined,
      ocrRawText: hasReceiptMetadata ? ocrRawText : undefined,
      status: "PENDING_MANUAL_REVIEW",
      verificationMethod: hasReceiptMetadata ? "OCR" : "MANUAL",
    });

    await payment.populate("fee", "title dueDate academicYear semester");

    return res.status(201).json({
      success: true,
      message: "Payment submitted and awaiting statement verification.",
      data: payment,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This GCash reference number has already been submitted.",
      });
    }

    console.error("Payment submission failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit the payment.",
    });
  }
};

const REFERENCE_DIGIT_PATTERN = /(?<!\d)(\d(?:[\s-]?\d){9,12})(?!\d)/g;

/**
 * Extracts unique 10-to-13-digit references from statement text. Spaces and
 * hyphens inside a reference are normalized, while phone-number-like runs are
 * excluded when preceded by a common phone label.
 *
 * @param {string} text
 * @returns {string[]}
 */
const extractStatementReferences = (text) => {
  const references = new Set();
  const source = String(text || "");
  let match;

  while ((match = REFERENCE_DIGIT_PATTERN.exec(source)) !== null) {
    const reference = match[1].replace(/[\s-]/g, "");
    const precedingText = source.slice(
      Math.max(0, match.index - 24),
      match.index,
    );

    if (
      /^\d{10,13}$/.test(reference) &&
      !/(?:mobile|phone|contact(?:\s+number)?)\s*[:#-]?\s*$/i.test(
        precedingText,
      )
    ) {
      references.add(reference);
    }
  }

  return [...references];
};

const isPdfPasswordError = (error) =>
  error instanceof PasswordException ||
  /password|encrypted|decrypt/i.test(String(error?.message || error));

let statementOcrWorkerPromise;
let statementOcrQueue = Promise.resolve();

const getStatementOcrWorker = async () => {
  if (!statementOcrWorkerPromise) {
    statementOcrWorkerPromise = createWorker("eng").catch((error) => {
      statementOcrWorkerPromise = undefined;
      throw error;
    });
  }
  return statementOcrWorkerPromise;
};

const recognizeStatementPage = (imageBuffer) => {
  const recognition = statementOcrQueue.then(async () => {
    const worker = await getStatementOcrWorker();
    const result = await worker.recognize(imageBuffer);
    return String(result.data?.text || "");
  });
  statementOcrQueue = recognition.catch(() => undefined);
  return recognition;
};

/**
 * Uses OCR as a fallback for image-only/scanned statement pages.
 * The normal text layer is attempted first because it is faster and more
 * accurate for digitally generated GCash PDFs.
 */
const extractScannedStatementText = async (parser) => {
  const screenshots = await parser.getScreenshot({
    scale: 1.5,
    imageBuffer: true,
    imageDataUrl: false,
  });
  const pageTexts = [];
  for (const [index, page] of screenshots.pages.entries()) {
    console.info(
      `[statement-scan] OCR page ${index + 1}/${screenshots.pages.length}`,
    );
    pageTexts.push(await recognizeStatementPage(Buffer.from(page.data)));
  }
  return pageTexts.join("\n");
};

/**
 * Verifies pending student payments from a password-protected GCash statement.
 *
 * @route POST /api/payments/verify-batch-pdf
 * @access Treasurer
 */
const verifyBatchPdf = async (req, res) => {
  const pdfPassword =
    typeof req.body?.pdfPassword === "string" ? req.body.pdfPassword : "";

  if (!req.file?.buffer) {
    return res.status(400).json({
      success: false,
      message: "A PDF statement file is required.",
    });
  }

  if (!pdfPassword.trim()) {
    return res.status(400).json({
      success: false,
      message: "The PDF password is required.",
    });
  }

  let parser;
  try {
    console.info(
      `[statement-scan] started file=${req.file.originalname || "statement.pdf"} size=${req.file.size || req.file.buffer.length} bytes`,
    );
    parser = new PDFParse({ data: req.file.buffer, password: pdfPassword });
    const result = await parser.getText();
    let rawText = String(result?.text || "");
    let references = extractStatementReferences(rawText);
    let extractionMethod = "text";

    console.info(
      `[statement-scan] text extraction found ${references.length} reference(s)`,
    );

    if (references.length === 0) {
      console.info(
        "[statement-scan] no text references; starting OCR fallback",
      );
      rawText = await extractScannedStatementText(parser);
      references = extractStatementReferences(rawText);
      extractionMethod = "ocr";
    }

    if (references.length === 0) {
      return res.status(422).json({
        success: false,
        message: "No valid GCash reference numbers were found in the PDF.",
      });
    }

    const verifiedAt = new Date();
    const updateResult = await Payment.updateMany(
      {
        organization: req.user.organization,
        status: "PENDING_MANUAL_REVIEW",
        referenceNumber: { $in: references },
      },
      {
        $set: {
          status: "VERIFIED",
          verificationMethod: "BULK_STATEMENT",
          verifiedAt,
          failureReason: undefined,
        },
      },
      { runValidators: true },
    );

    const matchedCount =
      updateResult.modifiedCount ?? updateResult.nModified ?? 0;
    const alreadyVerifiedCount = await Payment.countDocuments({
      organization: req.user.organization,
      status: "VERIFIED",
      referenceNumber: { $in: references },
    });

    console.info(
      `[statement-scan] completed method=${extractionMethod} references=${references.length} verified=${matchedCount}`,
    );

    return res.status(200).json({
      success: true,
      message: "GCash statement processed successfully.",
      data: {
        totalReferencesScanned: references.length,
        paymentsMatched: matchedCount,
        paymentsVerified: matchedCount,
        alreadyVerified: Math.max(0, alreadyVerifiedCount - matchedCount),
        unmatchedReferences: Math.max(
          0,
          references.length - alreadyVerifiedCount,
        ),
        extractionMethod,
      },
    });
  } catch (error) {
    if (isPdfPasswordError(error)) {
      return res.status(401).json({
        success: false,
        message: "Incorrect PDF password",
      });
    }

    console.error("[statement-scan] failed:", error);
    return res.status(422).json({
      success: false,
      message: "The PDF could not be read. Confirm the file and password.",
    });
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.error("Failed to release PDF parser resources:", destroyError);
      }
    }
  }
};

/**
 * Lists payment submissions owned by the authenticated student.
 *
 * @route GET /api/v1/payments/mine
 * @access Student
 */
const listMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .select(PAYMENT_PUBLIC_FIELDS)
      .populate("fee", "title dueDate academicYear semester")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Student payment retrieval failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your payments.",
    });
  }
};

/**
 * Returns one payment only when it belongs to the authenticated student.
 * Used by the pending-status poller.
 *
 * @route GET /api/v1/payments/:paymentId
 * @access Student
 */
const getMyPayment = async (req, res) => {
  if (!isObjectId(req.params.paymentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment identifier.",
    });
  }

  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      student: req.user._id,
    })
      .select(PAYMENT_PUBLIC_FIELDS)
      .populate("fee", "title dueDate academicYear semester")
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error("Payment status retrieval failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payment status.",
    });
  }
};

/**
 * Lists organization-scoped payments for a treasurer audit view.
 *
 * @route GET /api/v1/payments/audit?status=VERIFIED
 * @access Treasurer
 */
const listPaymentAudit = async (req, res) => {
  const requestedStatus = String(req.query.status || "ALL").toUpperCase();

  if (
    requestedStatus !== "ALL" &&
    !PAYMENT_STATUSES.includes(requestedStatus)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment status filter.",
    });
  }

  try {
    const query = { organization: req.user.organization };
    if (requestedStatus !== "ALL") query.status = requestedStatus;

    const payments = await Payment.find(query)
      .select(`${PAYMENT_PUBLIC_FIELDS} rawSmsMessage`)
      .populate("student", "name email")
      .populate("fee", "title")
      .sort({ verifiedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Treasurer payment audit retrieval failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the payment audit.",
    });
  }
};

module.exports = {
  createPayment,
  verifyBatchPdf,
  extractStatementReferences,
  getMyPayment,
  listMyPayments,
  listPaymentAudit,
};
