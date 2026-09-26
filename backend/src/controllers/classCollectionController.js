const mongoose = require("mongoose");
const Fee = require("../models/Fee");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Member = require("../models/MemberOrganization");
const Organization = require("../models/OrganizationModels");
const { normalizeReferenceNumber } = require("../models/Payment");
const {
  getCurrentAcademicPeriod,
  getAcademicPeriodFilter,
} = require("../util/academicPeriod");
const {
  getEffectiveClassRoster,
} = require("./orgMemberController");

const isObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value ?? ""));

const ownOrganizationId = (req) =>
  req.user.organization?._id || req.user.organization || null;

// Resolves the parent organization when the caller belongs to a class.
// Returns null for non-class contexts.
const resolveParentOrganization = async (req) => {
  const orgId = ownOrganizationId(req);
  if (!orgId) return null;
  // req.user.organization is usually a bare ObjectId (protect does not
  // populate it); only trust it directly when it is a populated document.
  const ref = req.user.organization;
  let org = null;
  if (ref && typeof ref === "object" && !(ref instanceof mongoose.Types.ObjectId) && ref.organizationType) {
    org = ref;
  } else {
    org = await Organization.findById(ref?._id || orgId).select(
      "organizationType parentOrganization",
    );
  }
  if (!org || org.organizationType !== "class" || !org.parentOrganization) {
    return null;
  }
  const parentId = org.parentOrganization?._id || org.parentOrganization;
  return Organization.findById(parentId).select(
    "_id name acronym college gcashNumber paymayaNumber gcashQrImage",
  );
};

// Resolves a member of the effective class roster: a manual class row or an
// onboarded parent member auto-matched by section. Faculty excluded.
const resolveEffectiveMember = async (req, memberId) => {
  if (!isObjectId(memberId)) return null;
  const member = await Member.findById(memberId).select(
    "name email idNumber role organization",
  );
  if (
    !member ||
    ["Faculty Adviser", "Department Dean"].includes(member.role)
  ) {
    return null;
  }
  const classOrgId = String(ownOrganizationId(req));
  if (String(member.organization) === classOrgId) return member;
  const effective = await getEffectiveClassRoster(classOrgId);
  if (!effective) return null;
  return (
    effective.members.find(
      (entry) => String(entry._id) === String(member._id),
    ) || null
  );
};

// All member ids in the effective class roster (for monitoring).
const effectiveMemberIds = async (req) => {
  const effective = await getEffectiveClassRoster(ownOrganizationId(req));
  if (!effective) return null;
  return effective.members.map((member) => member._id);
};

/**
 * Lists the parent organization's approved, active dues collections so a
 * class treasurer can collect them from classmates.
 *
 * @route GET /api/v1/fees/collectible
 * @access Treasurer (class organization)
 */
const listCollectibleFees = async (req, res) => {
  try {
    const parent = await resolveParentOrganization(req);
    if (!parent) {
      return res.status(403).json({
        success: false,
        message: "Only a class treasurer can view collectible dues.",
      });
    }

    const period = await getCurrentAcademicPeriod();
    const fees = await Fee.find({
      org: parent._id,
      ...getAcademicPeriodFilter(period),
      status: "active",
      approvalStatus: "approved",
      treasurerArchived: { $ne: true },
    })
      .select(
        "title description amount dueDate academicYear semester status approvalStatus targetYearLevel targetMemberCount paidMemberCount collectionPercentage",
      )
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: fees.length,
      data: fees,
      parent: parent
        ? {
            _id: parent._id,
            name: parent.name,
            gcashNumber: parent.gcashNumber || "",
            paymayaNumber: parent.paymayaNumber || "",
            gcashQrImage: parent.gcashQrImage || null,
          }
        : null,
    });
  } catch (error) {
    console.error("Collectible fee retrieval failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve collectible dues.",
    });
  }
};

/**
 * Records a classmate payment (cash or e-wallet) against a parent dues
 * collection. The payment stays pending until the organization treasurer
 * verifies it, and the class treasurer remits it separately.
 *
 * @route POST /api/v1/payments/class-collect
 * @access Treasurer (class organization)
 */
const recordClassPayment = async (req, res) => {
  const feeId = req.body?.feeId;
  const memberId = req.body?.memberId;
  const paymentMethod = String(req.body?.paymentMethod || "CASH").toUpperCase();
  const referenceNumber = normalizeReferenceNumber(req.body?.referenceNumber);
  const cashReceiptNumber = String(req.body?.cashReceiptNumber || "").trim();
  const cashNotes = String(req.body?.cashNotes || "").trim();

  if (
    !isObjectId(feeId) ||
    !isObjectId(memberId) ||
    !["CASH", "GCASH"].includes(paymentMethod)
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid member, fee, and payment method are required.",
    });
  }
  if (paymentMethod === "GCASH" && !/^\d{10,13}$/.test(referenceNumber)) {
    return res.status(400).json({
      success: false,
      message: "A valid 10-to-13-digit e-wallet reference number is required.",
    });
  }

  try {
    const parent = await resolveParentOrganization(req);
    if (!parent) {
      return res.status(403).json({
        success: false,
        message: "Only a class treasurer can record class payments.",
      });
    }

    const member = await resolveEffectiveMember(req, memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "The selected classmate was not found in your class roster.",
      });
    }

    const period = await getCurrentAcademicPeriod();
    const fee = await Fee.findOne({
      _id: feeId,
      org: parent._id,
      ...getAcademicPeriodFilter(period),
      status: "active",
      approvalStatus: "approved",
      treasurerArchived: { $ne: true },
    }).select("org amount title");
    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "The selected dues collection is not available for collection.",
      });
    }

    const student = await User.findOne({
      email: member.email.toLowerCase().trim(),
      status: "Active",
    }).select("name email");

    const identityQueries = [{ member: member._id }];
    if (student) identityQueries.push({ student: student._id });
    const existing = await Payment.findOne({
      $or: identityQueries,
      fee: fee._id,
      status: { $in: ["PENDING_MANUAL_REVIEW", "VERIFIED"] },
    }).select("_id status");
    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          existing.status === "VERIFIED"
            ? "This classmate already paid this collection."
            : "This classmate already has a pending payment for this collection.",
      });
    }

    const paymentData = {
      member: member._id,
      organization: fee.org,
      fee: fee._id,
      claimedAmount: fee.amount,
      paymentMethod,
      recordedBy: req.user._id,
      paidAt: new Date(),
      status: "PENDING_MANUAL_REVIEW",
      verificationMethod:
        paymentMethod === "CASH" ? "CASH_MANUAL" : "MANUAL",
      remitted: false,
    };
    // Omit reference keys entirely when unused: the schema setter would turn
    // an explicit undefined into an empty string and fail validation.
    if (student?._id) paymentData.student = student._id;
    if (paymentMethod === "GCASH") paymentData.referenceNumber = referenceNumber;
    if (cashReceiptNumber) paymentData.cashReceiptNumber = cashReceiptNumber;
    if (cashNotes) paymentData.cashNotes = cashNotes;

    const payment = await Payment.create(paymentData);
    await payment.populate("member", "name email idNumber role");
    await payment.populate("fee", "title amount dueDate academicYear semester");

    return res.status(201).json({
      success: true,
      message: "Payment recorded. Remit it to the organization treasurer.",
      data: payment,
    });
  } catch (error) {
    console.error("Class payment recording failed:", error);
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This e-wallet reference number has already been submitted.",
      });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((validationError) => validationError.message)
          .join(" "),
      });
    }
    return res
      .status(500)
      .json({ success: false, message: "Unable to record the payment." });
  }
};

/**
 * Monitors payments recorded for classmates of the caller's organization.
 *
 * @route GET /api/v1/payments/class-collected
 * @access Treasurer
 */
const listClassCollected = async (req, res) => {
  try {
    const memberIds = await effectiveMemberIds(req);
    if (!memberIds) {
      return res.status(400).json({
        success: false,
        message: "Organization context is required.",
      });
    }

    const payments = await Payment.find({
      member: { $in: memberIds },
    })
      .select(
        "member organization fee claimedAmount paymentMethod referenceNumber cashReceiptNumber cashNotes recordedBy paidAt status verificationMethod remitted remittedAt verifiedAt createdAt",
      )
      .populate("member", "name email idNumber role")
      .populate("fee", "title amount dueDate")
      .populate("recordedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Class collection retrieval failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve collected payments.",
    });
  }
};

/**
 * Marks a collected classmate payment as remitted to the organization
 * treasurer for verification.
 *
 * @route PATCH /api/v1/payments/:id/remit
 * @access Treasurer
 */
const remitClassPayment = async (req, res) => {
  if (!isObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment identifier.",
    });
  }

  try {
    const payment = await Payment.findById(req.params.id).select(
      "member status remitted",
    );
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    const memberIds = await effectiveMemberIds(req);
    if (
      !memberIds ||
      !memberIds.some((id) => String(id) === String(payment.member))
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only remit payments from your own class.",
      });
    }
    if (payment.status !== "PENDING_MANUAL_REVIEW") {
      return res.status(409).json({
        success: false,
        message: "Only pending payments can be remitted for verification.",
      });
    }
    if (payment.remitted) {
      return res.status(200).json({
        success: true,
        message: "Payment was already remitted.",
        data: payment,
      });
    }

    payment.remitted = true;
    payment.remittedAt = new Date();
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment remitted to the organization treasurer.",
      data: payment,
    });
  } catch (error) {
    console.error("Payment remit failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to remit the payment.",
    });
  }
};

module.exports = {
  listCollectibleFees,
  recordClassPayment,
  listClassCollected,
  remitClassPayment,
};
