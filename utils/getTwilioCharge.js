const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const getTwilioCharge = (timeInterval) => {
  const price = new Promise(async (resolve, reject) => {
    client.usage.records.lastMonth.each((record) => {
      if (record.category === "sms") {
        resolve(record.price);
      }
    });
  });
  return price;
};

module.exports = getTwilioCharge;
