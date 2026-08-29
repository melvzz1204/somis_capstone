export const ATTENDANCE_PHASES = [
  {
    key: "morning_in",
    field: "morningInAt",
    label: "Morning in",
  },
  {
    key: "lunch_out",
    field: "lunchOutAt",
    label: "Morning out",
  },
  {
    key: "afternoon_in",
    field: "afternoonInAt",
    label: "Afternoon in",
  },
  {
    key: "afternoon_out",
    field: "afternoonOutAt",
    label: "Afternoon out",
  },
];

const hasCreatedQr = (qr) =>
  Boolean(qr?.generatedAt || qr?.code || qr?.tokenHash);

export const getCreatedAttendanceCheckpoints = (event) => {
  const eventDays = Array.isArray(event?.attendanceDays)
    ? event.attendanceDays
    : [];

  const checkpoints = eventDays.flatMap((day, index) =>
    ATTENDANCE_PHASES.filter(({ key }) =>
      hasCreatedQr(day?.attendanceQr?.[key]),
    ).map((phase) => ({
      ...phase,
      day: Number(day?.day) || index + 1,
      date: day?.date || event?.startDateTime,
    })),
  );

  if (checkpoints.length || eventDays.length) return checkpoints;

  return ATTENDANCE_PHASES.filter(({ key }) =>
    hasCreatedQr(event?.attendanceQr?.[key]),
  ).map((phase) => ({
    ...phase,
    day: 1,
    date: event?.startDateTime,
  }));
};

export const getAttendanceScanCount = (record, checkpoints) => {
  const dailyRecords = new Map(
    (record?.days || []).map((day) => [Number(day.day), day]),
  );

  return checkpoints.reduce((count, checkpoint) => {
    const dailyRecord = dailyRecords.get(checkpoint.day);
    const value = dailyRecord
      ? dailyRecord[checkpoint.field]
      : checkpoint.day === 1
        ? record?.[checkpoint.field]
        : null;
    return count + (value ? 1 : 0);
  }, 0);
};

export const groupAttendanceCheckpointsByDay = (checkpoints) => {
  const groups = [];

  checkpoints.forEach((checkpoint) => {
    let group = groups.find((item) => item.day === checkpoint.day);
    if (!group) {
      group = {
        day: checkpoint.day,
        date: checkpoint.date,
        checkpoints: [],
      };
      groups.push(group);
    }
    group.checkpoints.push(checkpoint);
  });

  return groups.sort((first, second) => first.day - second.day);
};
