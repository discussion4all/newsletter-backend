const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY);

const Newsletter = require("../models/newsletter");

const chargeAccount = (newsletterId, amount) => {
  return new Promise(async (resolve, reject) => {
    const newsletter = await Newsletter.findOne({
      newsletterId,
    });

    if (!newsletter) {
      reject("newsletter not found");
    }

    const charge = await stripe.charges.create({
      amount,
      currency: "usd",
      source: newsletter.stripe.connect_account_id,
    });

    if (charge.status === "succeeded") {
      resolve("payment success");
    } else {
      reject("payment failed");
    }
  });
};

module.exports = {
  chargeAccount,
};
