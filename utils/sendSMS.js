const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const SUCCESS = (newsletterName) =>
  `You're subscribed to ${newsletterName}! Msg frequency will vary. Your Msg&Data rates may apply. Reply HELP for help, STOP to unsubscribe.`;

const FAIL = (newsletterName) =>
  `We are unable to charge your credit card & have paused your subscription to ${newsletterName}. Please contact us at spencerkier@gmail.com.`;

const sendSMS = (number, messageType, newsletterName) => {
  let text = "";
  if (messageType === "success") {
    text = SUCCESS(newsletterName);
  } else {
    text = FAIL(newsletterName);
  }

  client.messages.create({
    body: text,
    from: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to: number,
  });
};

module.exports = sendSMS;
