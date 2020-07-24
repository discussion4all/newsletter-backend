const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  phone: {
    type: String,
    default: "",
  },
  customer_id: {
    type: String,
    default: "",
  },
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
