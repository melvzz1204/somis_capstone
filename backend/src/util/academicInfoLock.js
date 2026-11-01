const EventAttendance = require("../models/EventAttendance");
const Payment = require("../models/Payment");

// A student's academic details (section / year level / program) are locked once
// they have attendance or verified dues activity, so historical records and
// dues targeting stay consistent. An officer can temporarily unlock editing.
const hasAcademicActivity = async (userId) => {
  if (!userId) return false;
  const [attendanceCount, paymentCount] = await Promise.all([
    EventAttendance.countDocuments({ student: userId }),
    Payment.countDocuments({ student: userId, status: "VERIFIED" }),
  ]);
  return attendanceCount > 0 || paymentCount > 0;
};

// Shapes a StudentProfile for the client, adding derived lock metadata without
// persisting it.
const buildStudentProfilePayload = async (profile) => {
  if (!profile) return null;
  const payload =
    typeof profile.toObject === "function"
      ? profile.toObject()
      : { ...profile };
  const hasActivity = await hasAcademicActivity(profile.user);
  payload.hasAcademicActivity = hasActivity;
  payload.academicEditLocked = hasActivity && !profile.academicEditUnlocked;
  return payload;
};

module.exports = { hasAcademicActivity, buildStudentProfilePayload };
