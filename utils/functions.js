const Newsletter = require("../models/newsletter");
const bodyParser = require("body-parser");

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

const createSubAccount = async (name) => {
  const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const account = await client.api.accounts.create({ friendlyName: name });

  return {
    subAccountSid: account.sid,
    subAccountAuthToken: account.authToken,
  };
};

const getBillings = async (newsletterId) => {
  const newsletter = await Newsletter.findOne({
    newsletterId,
  });
  console.log("bill this account ", newsletter);
  const client = require("twilio")(
    newsletter.twilio.sub_account_sid,
    newsletter.twilio.sub_account_auth_token
  );

  //   client.messages
  //     .list({ startTime: new Date(2020, 08, 01), limit: 5 })
  //     .then((sms) => console.log(sms));

  client.usage.records.lastMonth.each((record) => {
    if (record.category === "sms") {
      console.log(record);
    }
  });

  //   client.messages
  //     .create({
  //       from: process.env.PHONE_NUMBER,
  //       body: "Hey there, I've send this through a subAccount",
  //       to: "+919909582774",
  //     })
  //     .then((msg) => console.log("sent msg", msg))
  //     .catch((err) => console.log("error", err));
};

module.exports = {
  createSubAccount,
  getBillings,
};
