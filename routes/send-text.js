const express = require("express");
const router = express.Router();

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const Newsletter = require("../models/newsletter");

// SEND TEXT NOW
router.post("/now", async (req, res) => {
  try {
    const { newsletterId } = req.body;
    const subscribers = await getSubscribers(newsletterId);

    Promise.all(
      subscribers.map((number) => {
        return client.messages.create({
          body: req.body.text,
          from: process.env.TWILIO_MESSAGING_SERVICE_SID,
          to: number,
        });
      })
    )
      .then(async (messages) => {
        console.log("messages sent!!", messages);
        const updatedNewsletter = await updateTextSent(newsletterId);
        res.json({ status: 200, message: "success" });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: 200, message: "failed", error: err });
      });
  } catch (err) {
    res.json({ status: 200, message: "failed", error: err });
  }
});

const getSubscribers = async (newsletterId) => {
  const newsletter = await Newsletter.findOne({
    newsletterId,
  });

  return newsletter.subscribers;
};

const updateTextSent = (newsletterId) => {
  Newsletter.findOneAndUpdate(
    {
      newsletterId: newsletterId,
    },
    {
      $inc: { textSent: 1 },
    },
    (err, result) => {
      if (!err) {
        return result;
      }
      return err;
    }
  );
};

module.exports = router;
