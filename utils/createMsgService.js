const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const createMsgService = async (name) => {
  const service = await client.messaging.services
    .create({
      friendlyName: name,
    })
    .then((service) => service);
  // console.log("service", service);
  await client.messaging
    .services(service.sid)
    .phoneNumbers.create({ phoneNumberSid: process.env.PHONE_NUMBER_SID_1 })
    .then((phoneNumber) => phoneNumber);
  return service.sid;
};

module.exports = createMsgService;
