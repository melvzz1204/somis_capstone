const express = require("express");
const {
  createOrganizationDocument,
  getOrganizationDocuments,
  updateOrganizationDocument,
  reviewOrganizationDocument,
  deleteOrganizationDocument,
  removeFiles,
} = require("../controllers/organizationDocumentController");
const { protect, authorize } = require("../middleware/authMiddileware");
const organizationDocumentUpload = require("../middleware/organizationDocumentUpload");

const router = express.Router();

const uploadAttachments = (req, res, next) => {
  organizationDocumentUpload.array("attachments", 10)(req, res, (error) => {
    if (!error) return next();

    removeFiles((req.files || []).map((file) => ({ filename: file.filename })));
    return next(error);
  });
};

router
  .route("/")
  .get(
    protect,
    authorize("secretary", "org_admin", "treasurer", "adviser", "admin"),
    getOrganizationDocuments,
  )
  .post(
    protect,
    authorize("secretary", "org_admin", "treasurer"),
    uploadAttachments,
    createOrganizationDocument,
  );

router.patch(
  "/:id/review",
  protect,
  authorize("adviser", "admin"),
  reviewOrganizationDocument,
);

router
  .route("/:id")
  .put(
    protect,
    authorize("secretary", "org_admin", "treasurer"),
    uploadAttachments,
    updateOrganizationDocument,
  )
  .delete(
    protect,
    authorize("secretary", "org_admin", "treasurer"),
    deleteOrganizationDocument,
  );

module.exports = router;
