const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const Newsletter = require("../models/newsletter");

const createSubAccount = async (name) => {
  const account = await client.api.accounts.create({ friendlyName: name });

  return {
    subAccountSid: account.sid,
    subAccountAuthToken: account.authToken,
  };
};

const getTwilioBillings = async (newsletterId) => {
  const newsletter = await Newsletter.findOne({
    newsletterId,
  });

  if (!newsletter) {
    return "no newsletter found";
  }

  const subAccountClient = require("twilio")(
    newsletter.twilio.sub_account_sid,
    newsletter.twilio.sub_account_auth_token
  );

  return new Promise((resolve, reject) => {
    try {
      subAccountClient.usage.records.thisMonth.each((record) => {
        if (record.category === "sms") {
          resolve(record.price);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

const fetchAllPhoneNumbers = () => {
  return new Promise((resolve, reject) => {
    client.incomingPhoneNumbers
      .list({ limit: 20 })
      .then((PhoneNumbers) => resolve(PhoneNumbers))
      .catch((err) => reject(err));
  });
};

module.exports = {
  createSubAccount,
  getTwilioBillings,
  fetchAllPhoneNumbers,
};

/* TRANSER PHONE NUMBER TO THE SUBACCOUNT */
// client
//   .incomingPhoneNumbers(process.env.PHONE_NUMBER_SID_2)
//   .update({ accountSid: newsletter.twilio.sub_account_sid })
//   .then((incoming_phone_number) => console.log(incoming_phone_number));

/* SEND MSG FROM SUBACCOUNT USING HIS MSG SERVICE */
// setInterval(() => {
//   subAccountClient.messages
//     .create({
//       from: "MGa78421c9afd6fcb302fd33a0055b92c8",
//       body: `Hey there, I've send this through a subAccount ${new Date().getMinutes()}`,
//       to: "+919909582774",
//     })
//     .then((msg) => console.log("sent msg", msg))
//     .catch((err) => console.log("error", err));
// }, 60 * 1000);
