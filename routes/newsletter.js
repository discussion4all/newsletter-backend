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
    const { phoneNumber, newsletterId } = req.body;

    const newsletter = await Newsletter.findOne({
      newsletterId: newsletterId,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method_types: ["card"],
      amount: parseFloat(req.body.pay.slice(1)) * 100,
      currency: "usd",
      transfer_data: {
        destination: newsletter.stripe_user_id,
      },
    });

    if (paymentIntent.client_secret) {
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
              client_secret: paymentIntent.client_secret,
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

//GET NEWSLETTER BY ID
router.get("/:id", async (req, res) => {
  const newsletter = await Newsletter.findOne({
    newsletterId: req.params.id,
  });

  res.json({ status: 200, message: "success", data: newsletter });
});

module.exports = router;
