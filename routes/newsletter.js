const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY, {
  apiVersion: "",
});

const Newsletter = require("../models/newsletter");

// CRATE NEWSLETTER
router.post("/create", async (req, res) => {
  const { newsletterId, image, title, description, sampleText } = req.body;

  const product = await stripe.products.create(
    {
      name: title,
    },
    async (err, product) => {
      const newNewsletter = new Newsletter({
        newsletterId: newsletterId,
        imageUrl: image,
        title: title,
        description: description,
        sampleText: sampleText,
        stripe: {
          product_id: product.id,
        },
      });

      await newNewsletter.save();
    }
  );

  res.json({ status: 200, message: "success" });
});

// UPDATE PLANS
router.post("/update-plans", async (req, res) => {
  const { newsletterId, monthly, yearly } = req.body;

  const newsletter = await Newsletter.findOne({
    newsletterId: newsletterId,
  });

  let monthPlan, yearPlan;

  if (yearly) {
    yearPlan = await stripe.plans.create({
      amount: parseFloat(yearly.slice(1)) * 100,
      currency: "usd",
      interval: "year",
      product: newsletter.stripe.product_id,
    });
  }
  if (monthly) {
    monthPlan = await stripe.plans.create({
      amount: parseFloat(monthly.slice(1)) * 100,
      currency: "usd",
      interval: "month",
      product: newsletter.stripe.product_id,
    });
  }

  // console.log("monthPlan", monthPlan, "yearPlan", yearPlan);
  console.log(monthly, yearly);

  const updatedRecord = await Newsletter.findOneAndUpdate(
    {
      newsletterId: newsletterId,
    },
    {
      plans: {
        monthly: monthly,
        yearly: yearly,
      },
      "stripe.month_plan_id": monthPlan ? monthPlan.id : "",
      "stripe.year_plan_id": yearPlan ? yearPlan.id : "",
    },
    (err, record) => {
      if (!err) {
        res.json({
          status: 200,
          message: "success",
        });
      } else {
        console.log(err);
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

    // stripe.subscriptions.create(
    //   {
    //     customer: "cus_HRIQY9dLFTz1bC",
    //     items: [{ plan: "price_1GuWuMGbQku71cs1iRNeUIKI" }],
    //   },
    //   function (err, subscription) {
    //     // asynchronously called
    //   }
    // );

    const amount = parseFloat(req.body.pay.slice(1)) * 100;

    const stripeFee = amount * 0.029 + 30;
    const narateFee = amount * 0.05;

    console.log({ amount, stripeFee, narateFee, total: stripeFee + narateFee });

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method_types: ["card"],
      amount: amount,
      currency: "usd",
      application_fee_amount: Math.round(stripeFee + narateFee),
      transfer_data: {
        destination: newsletter.stripe.connect_account_id,
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
