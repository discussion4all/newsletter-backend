const express = require("express");
const router = express.Router();

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

router.post("/now", (req, res) => {
  try {
    console.log(req.body);

    client.messages
      .create({
        body: req.body.text,
        from: process.env.PHONE_NUMBER,
        to: req.body.phoneNumber,
      })
      .then((message) => {
        res.json({ status: 200, message: "success", res: message });
      });
  } catch (err) {
    res.json({ status: 200, message: "failed", error: err });
  }
});

module.exports = router;
