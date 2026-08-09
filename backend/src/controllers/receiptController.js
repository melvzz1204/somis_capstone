const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const mongoose = require("mongoose");
const { createWorker } = require("tesseract.js");
const Payment = require("../models/Payment");
const { normalizeReferenceNumber } = require("../models/Payment");

const RECEIPT_DIRECTORY = path.join(process.cwd(), "uploads", "receipts");
const OCR_TEXT_LIMIT = 20000;
const REFERENCE_DIGIT_PATTERN = /\d(?:[\s-]*\d){9,12}/g;
const LABELED_REFERENCE_PATTERN =
  /(?:reference|ref(?:erence)?\.?\s*(?:no\.?|number)?|transaction\s*(?:id|no\.?|number))\s*[:#-]?\s*(\d(?:[\s-]*\d){9,12})/gi;

let workerPromise;
let recognitionQueue = Promise.resolve();

const getOcrWorker = async () => {
  if (!workerPromise) {
    workerPromise = createWorker("eng").catch((error) => {
      workerPromise = undefined;
      throw error;
    });
  }

  return workerPromise;
};

/**
 * Serializes recognition because one Tesseract worker must not process two images concurrently.
 *
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>}
 */
const recognizeReceipt = (imageBuffer) => {
  const recognition = recognitionQueue.then(async () => {
    const worker = await getOcrWorker();
    const result = await worker.recognize(imageBuffer);
    return String(result.data?.text || "").trim();
  });

  recognitionQueue = recognition.catch(() => undefined);
  return recognition;
};

/**
 * Returns normalized 10-13 digit candidates, prioritizing values next to reference labels.
 *
 * @param {string} text
 * @returns {string[]}
 */
const extractReferenceCandidates = (text) => {
  const source = String(text || "");
  const candidates = [];
  const addCandidate = (value) => {
    const normalized = normalizeReferenceNumber(value);
    if (/^\d{10,13}$/.test(normalized) && !candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  let labeledMatch;
  while ((labeledMatch = LABELED_REFERENCE_PATTERN.exec(source)) !== null) {
    addCandidate(labeledMatch[1]);
  }
  LABELED_REFERENCE_PATTERN.lastIndex = 0;

  for (const match of source.match(REFERENCE_DIGIT_PATTERN) || []) {
    addCandidate(match);
  }

  return candidates;
};

/**
 * Extracts a paid amount from common GCash receipt labels. OCR output can put
 * the currency before the label, omit punctuation, or split the decimal point,
 * so several deliberately narrow patterns are checked before a currency-only
 * fallback is used.
 *
 * @param {string} text
 * @returns {number | undefined}
 */
const extractAmount = (text) => {
  const source = String(text || "")
    .replace(/[|]/g, "1")
    .replace(/\bPHP\b/gi, "₱");
  const number = `([\\d,]+(?:\\s*[.]\\s*\\d{1,2})?)`;
  // Transaction-detail screenshots may show the signed value as "+1.00"
  // on the same visual row as the Amount label, without a currency symbol.
  const signedNumber = `[+\\-]?\\s*${number}`;
  const amountPatterns = [
    new RegExp(
      `(?:amount|total)\\s*(?:paid|sent|amount)?\\s*[:#-]?\\s*(?:PHP|P|₱)?\\s*${signedNumber}`,
      "i",
    ),
    new RegExp(
      `(?:paid|sent|payment)\\s*(?:amount)?\\s*[:#-]?\\s*(?:PHP|P|₱)?\\s*${signedNumber}`,
      "i",
    ),
    new RegExp(`(?:PHP|₱)\\s*${signedNumber}`, "i"),
    new RegExp(`${signedNumber}\\s*(?:PHP|₱)`, "i"),
  ];

  for (const pattern of amountPatterns) {
    const match = source.match(pattern);
    if (!match) continue;
    const rawAmount = (match[2] || match[1])
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/^\+/, "");
    const amount = Number(rawAmount);
    if (Number.isFinite(amount) && amount > 0) return amount;
  }

  return undefined;
};

const saveReceipt = async (file) => {
  const extensionByMime = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  const filename = `${Date.now()}-${crypto.randomUUID()}${extensionByMime[file.mimetype]}`;

  await fs.mkdir(RECEIPT_DIRECTORY, { recursive: true });
  await fs.writeFile(path.join(RECEIPT_DIRECTORY, filename), file.buffer, {
    flag: "wx",
  });

  return `/uploads/receipts/${filename}`;
};

const getPublicReceiptUrl = (req, relativeUrl) => {
  const configuredBaseUrl = String(process.env.PUBLIC_API_URL || "").replace(
    /\/$/,
    "",
  );
  return configuredBaseUrl
    ? `${configuredBaseUrl}${relativeUrl}`
    : `${req.protocol}://${req.get("host")}${relativeUrl}`;
};

const parseOptionalObjectId = (value) => {
  if (value == null || value === "") return null;
  return mongoose.Types.ObjectId.isValid(String(value)) ? value : undefined;
};

/**
 * Stores and verifies an authenticated student's GCash receipt.
 *
 * @route POST /api/payments/upload-receipt
 * @access Student
 */
const uploadReceipt = async (req, res) => {
  const claimedAmount = Number(req.body?.claimedAmount);
  const event = parseOptionalObjectId(req.body?.event);

  if (!Number.isFinite(claimedAmount) || claimedAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Claimed amount must be a number greater than zero.",
    });
  }

  if (event === undefined) {
    return res.status(400).json({
      success: false,
      message: "Event must be a valid identifier when provided.",
    });
  }

  let receiptImageUrl;
  try {
    const relativeReceiptUrl = await saveReceipt(req.file);
    receiptImageUrl = getPublicReceiptUrl(req, relativeReceiptUrl);
  } catch (error) {
    console.error("Receipt storage failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to store the receipt image.",
    });
  }

  let ocrRawText = "";
  let ocrFailureReason = "";
  try {
    ocrRawText = await recognizeReceipt(req.file.buffer);
  } catch (error) {
    ocrFailureReason = "OCR processing failed; receipt requires manual review.";
    console.error("Receipt OCR failed:", error);
  }

  const referenceNumber = extractReferenceCandidates(ocrRawText).find(
    (candidate) => candidate.length === 13,
  );
  const extractedAmount = extractAmount(ocrRawText);
  const amountMatched =
    Number.isFinite(extractedAmount) &&
    Math.abs(extractedAmount - claimedAmount) < 0.01;
  let status = "PENDING_MANUAL_REVIEW";
  let failureReason = ocrFailureReason;

  try {
    if (!referenceNumber && !failureReason) {
      failureReason =
        "We could not read a 13-digit GCash reference number. Upload a clear, uncropped receipt showing the reference and amount.";
    } else if (!Number.isFinite(extractedAmount)) {
      failureReason =
        "We found the reference number, but could not read the paid amount. Upload a clearer receipt showing the Amount Paid.";
    } else if (!amountMatched) {
      status = "REJECTED";
      failureReason = `Receipt amount PHP ${extractedAmount.toFixed(2)} does not match the amount due PHP ${claimedAmount.toFixed(2)}.`;
    } else if (referenceNumber) {
      const duplicate = await Payment.exists({ referenceNumber });
      if (duplicate) {
        status = "REJECTED";
        failureReason =
          "This GCash reference number has already been submitted.";
      } else {
        status = "VERIFIED";
        failureReason = "";
      }
    }

    if (req.body?.parseOnly === "true") {
      const parsedData = {
        referenceNumber: referenceNumber || null,
        receiptImageUrl,
        ocrRawText: ocrRawText.slice(0, OCR_TEXT_LIMIT),
        extractedAmount: extractedAmount ?? null,
        amountDue: claimedAmount,
        amountMatched,
      };

      return res.status(status === "VERIFIED" ? 200 : 422).json({
        success: status === "VERIFIED",
        message:
          status === "VERIFIED"
            ? `Receipt validated. The paid amount PHP ${extractedAmount.toFixed(2)} matches the amount due.`
            : failureReason,
        status,
        referenceNumber: referenceNumber || null,
        data: parsedData,
      });
    }

    const paymentData = {
      student: req.user._id,
      event,
      claimedAmount,
      extractedAmount,
      referenceNumber,
      receiptImageUrl,
      ocrRawText: ocrRawText.slice(0, OCR_TEXT_LIMIT),
      status,
      failureReason,
      organization: req.user.organization || undefined,
      verificationMethod: "OCR",
      verifiedAt: status === "VERIFIED" ? new Date() : undefined,
    };

    let payment;
    try {
      payment = await Payment.create(paymentData);
    } catch (error) {
      if (error?.code !== 11000 || !referenceNumber) throw error;

      payment = await Payment.create({
        ...paymentData,
        status: "REJECTED",
        failureReason: "Duplicate Reference Number",
        verifiedAt: undefined,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        payment.status === "VERIFIED"
          ? "Receipt verified successfully."
          : payment.status === "REJECTED"
            ? "Receipt rejected because its reference number was already used."
            : "Receipt submitted for Treasurer manual review.",
      status: payment.status,
      referenceNumber: referenceNumber || null,
      data: payment,
    });
  } catch (error) {
    console.error("Receipt verification persistence failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete receipt verification.",
    });
  }
};

module.exports = {
  uploadReceipt,
  extractReferenceCandidates,
  extractAmount,
  recognizeReceipt,
};
