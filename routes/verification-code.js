const express = require("express");
const router = express.Router();

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// SEND CODE
router.post("/send", async (req, res) => {
  await client.verify
    .services(process.env.TWILIO_SERVICE_SID)
    .verifications.create({
      to: req.body.phoneNumber,
      channel: "sms",
    })
    .then((verification) => {
      if (verification) {
        res.json({ status: 200, message: "success" });
      }
    })
    .catch((err) => {
      if (err) {
        res.json({ status: 200, message: "invalid no", api_response: err });
      }
    });
});

// VERIFY CODE
router.post("/verify", async (req, res) => {
  await client.verify
    .services(process.env.TWILIO_SERVICE_SID)
    .verificationChecks.create({
      to: req.body.phoneNumber,
      code: req.body.code,
    })
    .then((verification) => {
      res.json({
        status: 200,
        message: "success",
        verifyStatus: verification.status,
      });
    })
    .catch((err) => {
      if (err) {
        res.json({
          status: 200,
          message: "invalid code",
          api_response: err,
        });
      }
    });
});

module.exports = router;
