const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const SUCCESS = (newsletterName) =>
  `You're subscribed to ${newsletterName}! Msg frequency will vary. Your Msg&Data rates may apply. Reply HELP for help, STOP to unsubscribe.`;

const sendSMS = (number, messageType, newsletterName) => {
  let text = "";
  if (messageType === "success") {
    text = SUCCESS(newsletterName);
  } else {
  }

  client.messages.create({
    body: text,
    from: process.env.TWILIO_MESSAGING_SERVICE_SID,
    to: number,
  });
};

module.exports = sendSMS;
