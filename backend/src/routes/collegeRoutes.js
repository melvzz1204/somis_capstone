const express = require("express");
const College = require("../models/College");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

const DEFAULT_COLLEGES = [
  {
    code: "CET",
    name: "College of Engineering and Technology",
    programs: [
      { name: "BS Civil Engineering" },
      { name: "BS Electrical Engineering" },
      { name: "BS Mechanical Engineering" },
      { name: "BS Computer Engineering" },
    ],
  },
  {
    code: "CICS",
    name: "College of Information and Computing Sciences",
    programs: [
      { name: "BS Information Technology" },
      { name: "BS Computer Science" },
      { name: "BS Information Systems" },
    ],
  },
  {
    code: "CBA",
    name: "College of Business and Accountancy",
    programs: [
      { name: "BS Accountancy" },
      { name: "BS Business Administration" },
      { name: "BS Hospitality Management" },
      { name: "BS Tourism Management" },
    ],
  },
  {
    code: "CED",
    name: "College of Education",
    programs: [
      { name: "Bachelor of Secondary Education" },
      { name: "Bachelor of Elementary Education" },
      { name: "Bachelor of Physical Education" },
    ],
  },
  {
    code: "CASS",
    name: "College of Arts and Social Sciences",
    programs: [
      { name: "BA Communication" },
      { name: "BA Political Science" },
      { name: "BS Social Work" },
    ],
  },
  {
    code: "CAFC",
    name: "College of Agriculture, Forestry, and Fisheries",
    programs: [
      { name: "BS Agriculture" },
      { name: "BS Forestry" },
      { name: "BS Fisheries" },
    ],
  },
];

const normalize = (value) => String(value || "").trim();

async function ensureDefaultColleges() {
  const collegeCount = await College.countDocuments();
  if (collegeCount === 0) {
    await College.insertMany(DEFAULT_COLLEGES);
  }
}

router.get("/", async (req, res) => {
  try {
    await ensureDefaultColleges();
    const colleges = await College.find().sort({ name: 1 });
    return res.status(200).json(colleges);
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return res.status(500).json({ message: "Failed to load colleges." });
  }
});

router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const code = normalize(req.body.code).toUpperCase();
    const name = normalize(req.body.name);

    if (!code || !name) {
      return res
        .status(400)
        .json({ message: "College code and name are required." });
    }

    const duplicate = await College.findOne({
      $or: [{ code }, { name }],
    }).collation({ locale: "en", strength: 2 });

    if (duplicate) {
      return res.status(409).json({
        message: "A college with this code or name already exists.",
      });
    }

    const college = await College.create({ code, name });
    return res.status(201).json({
      message: "College added successfully.",
      college,
    });
  } catch (error) {
    console.error("Error adding college:", error);
    return res.status(500).json({ message: "Failed to add college." });
  }
});

router.delete("/:collegeId", protect, authorize("admin"), async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found." });
    }

    return res.status(200).json({ message: "College deleted successfully." });
  } catch (error) {
    console.error("Error deleting college:", error);
    return res.status(500).json({ message: "Failed to delete college." });
  }
});

router.post(
  "/:collegeId/programs",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const programName = normalize(req.body.name);
      if (!programName) {
        return res.status(400).json({ message: "Program name is required." });
      }

      const college = await College.findById(req.params.collegeId);
      if (!college) {
        return res.status(404).json({ message: "College not found." });
      }

      const duplicate = college.programs.some(
        (program) => program.name.toLowerCase() === programName.toLowerCase(),
      );
      if (duplicate) {
        return res
          .status(409)
          .json({ message: "This program is already registered." });
      }

      college.programs.push({ name: programName });
      await college.save();

      return res.status(201).json({
        message: "Program added successfully.",
        program: college.programs.at(-1),
      });
    } catch (error) {
      console.error("Error adding program:", error);
      return res.status(500).json({ message: "Failed to add program." });
    }
  },
);

router.delete(
  "/:collegeId/programs/:programId",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const college = await College.findById(req.params.collegeId);
      if (!college) {
        return res.status(404).json({ message: "College not found." });
      }

      const program = college.programs.id(req.params.programId);
      if (!program) {
        return res.status(404).json({ message: "Program not found." });
      }

      program.deleteOne();
      await college.save();
      return res.status(200).json({ message: "Program deleted successfully." });
    } catch (error) {
      console.error("Error deleting program:", error);
      return res.status(500).json({ message: "Failed to delete program." });
    }
  },
);

module.exports = router;
