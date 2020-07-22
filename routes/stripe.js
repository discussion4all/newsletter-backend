const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY);

const Newsletter = require("../models/newsletter");

router.post("/connect", async (req, res) => {
  const { newsletterId } = req.body;

  const response = await stripe.oauth.token({
    grant_type: "authorization_code",
    code: req.body.code,
  });

  const updateNewsletter = await Newsletter.findOneAndUpdate(
    {
      newsletterId: newsletterId,
    },
    {
      stripe_user_id: response.stripe_user_id,
    },
    (err, record) => {
      if (!err) {
        res.status(200).json({ message: "success" });
      } else {
        res
          .status(500)
          .json({ message: "failed in saving stripe data", error: err });
      }
    }
  );
});

router.post("/charge", async (req, res) => {
  const newsletter = await Newsletter.findOne({
    newsletterId: req.body.newsletterId,
  });

  const paymentIntent = await stripe.paymentIntents.create({
    payment_method_types: ["card"],
    amount: parseFloat(req.body.pay.slice(1)) * 100,
    currency: "usd",
    description: "send it other account",

    transfer_data: {
      destination: newsletter.stripe_user_id,
    },
  });

  res.json({
    status: 200,
    message: "success",
    client_secret: paymentIntent.client_secret,
  });
});

module.exports = router;
