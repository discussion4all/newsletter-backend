const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const ScheduleTexts = require("../models/schedule-texts");
const Newsletter = require("../models/newsletter");

const scheduleTexts = () => {
  setInterval(async () => {
    const schedules = await ScheduleTexts.find({
      completed: false,
      time: {
        $gte: new Date(new Date().getTime() - 5 * 60 * 1000),
        $lt: new Date(),
      },
    });
    // console.log("schedules", schedules);

    if (schedules.length === 0) {
      // console.log("No schedules found, returning...");
      return;
    }

    const newsletterIds = schedules.map((e) => e.newsletterId);
    const subscribers = await getsubs(newsletterIds);

    schedules.map(async (schedule) => {
      const subs = subscribers[schedule.newsletterId].subscribers;
      Promise.all(
        subs.map((number) => {
          return client.messages.create({
            body: schedule.text,
            from: subscribers[schedule.newsletterId].msgServiceSid,
            to: number,
          });
        })
      )
        .then(async (messages) => {
          const updatedNewsletter = await updateTextSent(schedule.newsletterId);
          const updatedSchedules = await updateScheduleStatus(schedule._id);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }, 60 * 1000);
};

async function getsubs(newsletterIds) {
  const newsletters = await Newsletter.find({
    newsletterId: newsletterIds,
  });
  let subsObject = {};
  const subs = newsletters.map((e) => {
    subsObject[e.newsletterId] = {
      subscribers: e.subscribers,
      msgServiceSid: e.twilio.msg_service_sid,
    };
  });

  return subsObject;
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
