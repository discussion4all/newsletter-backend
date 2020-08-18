const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY, {
  apiVersion: "",
});

const Newsletter = require("../models/newsletter");
const Customer = require("../models/customer");
// const sendSMS = require("../utils/sendSMS");
const createMsgService = require("../utils/createMsgService");
const {
  createSubAccount,
  createMessageService,
} = require("../utils/twilioFunctions");

// CRATE NEWSLETTER
router.post("/create", async (req, res) => {
  const { newsletterId, image, title, description, sampleText } = req.body;

  const product = await stripe.products.create(
    {
      name: title,
    },
    async (err, product) => {
      const newsletters = await Newsletter.find({});
      const { subAccountSid, subAccountAuthToken } = await createSubAccount(
        title
      );
      const msgSid = await createMessageService(
        subAccountSid,
        subAccountAuthToken,
        title
      );
      // console.log({ subAccountSid, subAccountAuthToken, msgSid });
      console.log("msgSid", msgSid)
      let msgServiceSid;
      if (newsletters.length >= 1) {
        msgServiceSid =
          newsletters[newsletters.length - 1].twilio.msg_service_sid;
      } else {
        console.log("create a service")
        msgServiceSid = await createMsgService(title);
      }

      const newNewsletter = new Newsletter({
        newsletterId: newsletterId,
        imageUrl: image,
        title: title,
        description: description,
        sampleText: sampleText,
        stripe: {
          product_id: product.id,
        },
        twilio: {
          msg_service_sid: msgServiceSid || "",
          sub_account_sid: subAccountSid,
          sub_account_auth_token: subAccountAuthToken,
        },
        created_on: new Date(),
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
    const { plan, token, phoneNumber, newsletterId } = req.body;

    const newsletter = await Newsletter.findOne({
      newsletterId: newsletterId,
    });

    let customer = await Customer.findOne({
      phone: phoneNumber,
    });

    if (!customer) {
      console.log("customer not found plz create one");
      const stripeCustomer = await stripe.customers.create({
        phone: phoneNumber,
        source: token,
      });

      customer = {
        phone: phoneNumber,
        customer_id: stripeCustomer.id,
      };

      const newCustomer = new Customer({
        phone: phoneNumber,
        customer_id: stripeCustomer.id,
      });

      await newCustomer.save();
    }

    let planType = "month_plan_id";
    if (plan === "yearly") {
      planType = "year_plan_id";
    }
    // console.log("planType", planType);
    // console.log("customer", customer);

    const subscription = await stripe.subscriptions.create({
      customer: customer.customer_id,
      items: [
        {
          plan: newsletter.stripe[planType],
        },
      ],
      expand: ["latest_invoice.payment_intent"],
      application_fee_percent: 7.5,
      transfer_data: {
        destination: newsletter.stripe.connect_account_id,
      },
    });

    // console.log("subscription", subscription);
    // console.log("status: ", subscription.latest_invoice.payment_intent.status);

    // if (subscription.latest_invoice.payment_intent.status === "succeeded") {
    //   sendSMS(phoneNumber, "success", newsletter.title);
    // }

    if (subscription.id) {
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

    // const amount = parseFloat(req.body.pay.slice(1)) * 100;

    // const stripeFee = amount * 0.029 + 30;
    // const narateFee = amount * 0.05;

    // console.log({ amount, stripeFee, narateFee, total: stripeFee + narateFee });

    // const paymentIntent = await stripe.paymentIntents.create({
    //   payment_method_types: ["card"],
    //   amount: amount,
    //   currency: "usd",
    //   application_fee_amount: Math.round(stripeFee + narateFee),
    //   transfer_data: {
    //     destination: newsletter.stripe.connect_account_id,
    //   },
    // });

    // if (paymentIntent.client_secret) {
    //   Newsletter.findOneAndUpdate(
    //     {
    //       newsletterId: newsletterId,
    //     },
    //     {
    //       $addToSet: {
    //         subscribers: phoneNumber,
    //       },
    //     },
    //     (err, record) => {
    //       if (!err) {
    //         res.json({
    //           status: 200,
    //           message: "success",
    //           client_secret: paymentIntent.client_secret,
    //         });
    //       } else {
    //         res.json({
    //           status: 200,
    //           message: "failed in adding you to subscribers list",
    //         });
    //       }
    //     }
    //   );
    // }
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
