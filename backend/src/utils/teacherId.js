// utils/teacherId.js
import Counter from "../models/Counter.js";

export const nextTeacherId = async (department) => {
  const prefix = department?.toUpperCase() || "GEN";

  // Try finding existing counter
  let counter = await Counter.findById(`teacherId:${prefix}`);

  // If missing, initialize it
  if (!counter) {
    counter = await Counter.create({
      _id: `teacherId:${prefix}`,
      seq: 1
    });
    return `${prefix}-001`;
  }

  // Increment and save
  counter.seq += 1;
  await counter.save();

  // Return ID like CSE-044
  return `${prefix}-${String(counter.seq).padStart(3, "0")}`;
};
