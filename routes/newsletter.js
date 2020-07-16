const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY, {
  apiVersion: "",
});

const Newsletter = require("../models/newsletter");

// CRATE NEWSLETTER
router.post("/create", async (req, res) => {
  const { newsletterId, image, title, description, sampleText } = req.body;

  const newNewsletter = new Newsletter({
    newsletterId: newsletterId,
    imageUrl: image,
    title: title,
    description: description,
    sampleText: sampleText,
  });

  await newNewsletter.save();
  res.json({ status: 200, message: "success" });
});

// UPDATE PLANS
router.post("/update-plans", async (req, res) => {
  const { newsletterId, monthly, yearly } = req.body;

  const updatedRecord = Newsletter.findOneAndUpdate(
    {
      newsletterId: newsletterId,
    },
    {
      plans: {
        monthly: monthly,
        yearly: yearly,
      },
    },
    (err, record) => {
      if (!err) {
        res.json({
          status: 200,
          message: "success",
        });
      } else {
        res.json({
          status: 200,
          message: "failed in updating plans",
        });
      }
    }
  );
});

// SUBSCRIBE TO NEWSLETTER
router.post("/subscribe", async (req, res) => {
  try {
    const { token, phoneNumber, newsletterId } = req.body;
    const pay = parseFloat(req.body.pay.slice(1) + "00");

    const charge = await stripe.charges.create({
      amount: pay,
      currency: "usd",
      description: "Example charge",
      source: token,
    });
    console.log("phone", phoneNumber);
    console.log("charge", charge);

    if (charge.status === "succeeded") {
      Newsletter.findOneAndUpdate(
        {
          newsletterId: newsletterId,
        },
        {
          $addToSet: {
            subscribers: phoneNumber,
          },
        },
        (err, record) => {
          if (!err) {
            res.json({
              status: 200,
              message: "success",
            });
          } else {
            res.json({
              status: 200,
              message: "failed in adding you to subscribers list",
            });
          }
        }
      );
    }
  } catch (err) {
    console.log(err);
    res.json({ status: 500, message: "payment failed", error: err });
  }
});

module.exports = router;
