const express = require("express");
const router = express.Router();

const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const Newsletter = require("../models/newsletter");
const ScheduleTexts = require("../models/schedule-texts");
const TWILIO_CHARACTER_LIMIT = 160;

// SEND TEXT NOW
router.post("/now", async (req, res) => {
  try {
    const { newsletterId, text } = req.body;
    const data = await fetchData(newsletterId);
    const { subscribers, total_text_sent, msgServiceSid } = data;
    let msgSet = 1;
    if (text.length > TWILIO_CHARACTER_LIMIT) {
      msgSet = Math.ceil(text.length / TWILIO_CHARACTER_LIMIT);
    }

    console.log("smgset", msgSet, "L", text.length);

    Promise.all(
      subscribers.map((number) => {
        return client.messages.create({
          body: text,
          from: msgServiceSid,
          to: number,
        });
      })
    )
      .then(async (messages) => {
        console.log("messages sent!!", messages);
        const totalTextSent = msgSet * subscribers.length + total_text_sent;
        const updatedNewsletter = await updateTextSent(
          newsletterId,
          totalTextSent
        );
        addToSchedule(newsletterId, new Date(), text);
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

// SCHEDULE TEXTS
router.post("/schedule", async (req, res) => {
  const { newsletterId, time, text } = req.body;

  const newSchedule = new ScheduleTexts({
    newsletterId,
    time,
    text,
    is_scheduled: "yes",
    created_on: new Date(),
  });

  await newSchedule.save();
  res.status(200).json({ message: "success" });
});

const fetchData = async (newsletterId) => {
  const newsletter = await Newsletter.findOne({
    newsletterId,
  });

  return {
    subscribers: newsletter.subscribers,
    total_text_sent: newsletter.total_text_sent,
    msgServiceSid: newsletter.twilio.msg_service_sid,
  };
};

const updateTextSent = (newsletterId, totalTextSent) => {
  Newsletter.findOneAndUpdate(
    {
      newsletterId: newsletterId,
    },
    {
      $inc: { textSent: 1 },
      total_text_sent: totalTextSent,
    },
    (err, result) => {
      if (!err) {
        return result;
      }
      return err;
    }
  );
};

const addToSchedule = (newsletterId, time, text) => {
  const newSchedule = new ScheduleTexts({
    newsletterId,
    time,
    text,
    completed: true,
    is_scheduled: "no",
    created_on: new Date(),
  });

  newSchedule.save();
};

module.exports = router;
