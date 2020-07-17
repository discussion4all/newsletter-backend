const mongoose = require("mongoose");

const scheduleTextSchema = new mongoose.Schema({
  newsletterId: {
    type: Number,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const ScheduleTexts = mongoose.model("ScheduleTexts", scheduleTextSchema);

module.exports = ScheduleTexts;
