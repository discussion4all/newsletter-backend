const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema({
  newsletterId: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  sampleText: {
    type: String,
    required: true,
  },
  monthlyPrice: {
    type: String,
  },
  yearlyPrice: {
    type: String,
  },
});

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

module.exports = Newsletter;
