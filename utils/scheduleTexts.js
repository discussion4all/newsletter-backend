const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const ScheduleTexts = require("../models/schedule-texts");
const Newsletter = require("../models/newsletter");

const scheduleTexts = () => {
  setInterval(async () => {
    console.log("currnt time", new Date());
    console.log(
      "currnt time - 5",
      new Date(new Date().getTime() - 5 * 60 * 1000)
    );

    const schedules = await ScheduleTexts.find({
      completed: false,
      time: {
        $gte: new Date(new Date().getTime() - 5 * 60 * 1000),
        $lt: new Date(),
      },
    });
    console.log("schedules", schedules);

    if (schedules.length === 0) {
      console.log("returning...");
      return;
    }

    const newsletterId = schedules.map((e) => e.newsletterId);

    const subs = await fetchSubs(newsletterId[0]);
    Promise.all(
      subs.map((number) => {
        return client.messages.create({
          body: schedules[0].text,
          from: process.env.TWILIO_MESSAGING_SERVICE_SID,
          to: number,
        });
      })
    )
      .then(async (messages) => {
        console.log("messages sent!!", messages);
        const updatedNewsletter = await updateTextSent(newsletterId[0]);
        const updatedSchedules = await updateScheduleStatus(schedules[0]._id);
      })
      .catch((err) => {
        console.log(err);
      });
  }, 60 * 1000);
};

async function fetchSubs(newsletterId) {
  const newsletter = await Newsletter.findOne({
    newsletterId,
  });

  return (newsletter && newsletter.subscribers) || [];
}

function updateTextSent(newsletterId) {
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
}

async function updateScheduleStatus(scheduleId) {
  await ScheduleTexts.findByIdAndUpdate(
    {
      _id: scheduleId,
    },
    {
      completed: true,
    },
    (err, result) => {
      if (!err) {
        console.log("updated record schedule", result);
        return result;
      }
      console.log("error in complete true", err);
    }
  );
}

module.exports = scheduleTexts;
