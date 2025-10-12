// backend/src/models/Counter.js
import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema(
  { _id: { type: String }, seq: { type: Number, default: 0 } },
  { versionKey: false }
);

export default mongoose.model("Counter", CounterSchema, "counters");
