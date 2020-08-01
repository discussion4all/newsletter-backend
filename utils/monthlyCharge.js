const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY, {
  apiVersion: "",
});

const Newsletter = require("../models/newsletter");

const HOUR_24 = 24 * 60 * 60 * 1000;

const monthlyCharge = () => {
  setInterval(async () => {
    console.log("once in 24 hours...");
    // console.log("end of month date", endOfMonth(new Date()));
    // console.log("todays date", new Date().getDate());
    // console.log("check", new Date().getDate() === endOfMonth(new Date()));
    // if (new Date(2020, 07, 31).getDate() == endOfMonth(new Date())) {
    //   console.log("charge it up its the end of month...");
    //   const newsletters = await Newsletter.find({});
    //   console.log("newsletters", newsletters);
    //   Promise.all(
    //     newsletters.map(async (letter) => {
    //       const amount = letter.total_text_sent * 0.0075 * 100;
    //       const charge = await stripe.charges.create({
    //         amount: amount,
    //         currency: "usd",
    //         source: letter.stripe.connect_account_id,
    //       });
    //     })
    //   )
    //     .then((results) => {
    //       console.log("results", results);
    //     })
    //     .catch((err) => {
    //       console.log("err", err);
    //     });
    // }
  }, HOUR_24);
};

const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

module.exports = monthlyCharge;
