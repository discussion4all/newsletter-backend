const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY);

const Newsletter = require("../models/newsletter");

const createChargeStripe = async (newsletterId, price) => {
  const newsletter = await Newsletter.findOne({
    newsletterId,
  });

  console.log(newsletter);
  //   const charge = await stripe.charges.create({
  //     amount: amount,
  //     currency: "usd",
  //     source: letter.stripe.connect_account_id,
  //   });
};

module.exports = createChargeStripe;
