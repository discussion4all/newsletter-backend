const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  monthly: {
    type: Number,
  },
  yearly: {
    type: Number,
  },
  id: {
    type: Number,
  },
  access_token: {
    type: String,
  },
  refresh_token: {
    type: String,
  },
  stripe_user_id: {
    type: String,
  },
});

const Payment = new mongoose.model("Payment", paymentSchema);

module.exports = Payment;
