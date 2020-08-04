const Customer = require("../models/customer");
const Newsletter = require("../models/newsletter");
const sendSMS = require("./sendSMS");

async function webhook(req, res) {
  const { status, customer } = req.body.data.object;
  const productId = req.body.data.object.plan.product;
  const customerRecord = await Customer.findOne({
    customer_id: customer,
  });

  const newsletter = await Newsletter.findOne({
    "stripe.product_id": productId,
  });

  if (!customer) {
    return;
  }
  console.log("from webhook...");
  switch (status) {
    case "active":
      sendSMS(
        customerRecord.phone,
        "success",
        newsletter.title,
        newsletter.twilio.msg_service_sid
      );
      break;
    case "past_due":
      sendSMS(
        customerRecord.phone,
        "fail",
        newsletter.title,
        newsletter.twilio.msg_service_sid
      );
  }

  res.json({
    message: "message recieved",
  });
}

module.exports = webhook;
