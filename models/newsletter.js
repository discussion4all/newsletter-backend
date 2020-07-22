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
  plans: {
    yearly: {
      type: String,
      default: "$0",
    },
    monthly: {
      type: String,
      default: "$0",
    },
  },
  subscribers: {
    type: [String],
  },
  textSent: {
    type: Number,
    default: 0,
  },
  stripe_user_id: {
    type: String,
    default: "",
  },
});

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

module.exports = Newsletter;
