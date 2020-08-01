const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY);

const Newsletter = require("../models/newsletter");
const webhook = require("../utils/stripeWebhook");

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
      "stripe.connect_account_id": response.stripe_user_id,
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

router.post("/webhook", webhook);

module.exports = router;
