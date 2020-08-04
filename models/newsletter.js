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
  total_text_sent: {
    type: Number,
    default: 0,
  },
  stripe: {
    connect_account_id: {
      type: String,
      default: "",
    },
    product_id: {
      type: String,
      default: "",
    },
    month_plan_id: {
      type: String,
      default: "",
    },
    year_plan_id: {
      type: String,
      default: "",
    },
  },
  created_on: {
    type: Date,
  },
  twilio: {
    msg_service_sid: {
      type: String,
      default: "",
    },
  },
});

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

module.exports = Newsletter;
