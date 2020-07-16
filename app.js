const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const formidable = require("formidable");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY, {
  apiVersion: "",
});
const BitlyClient = require("bitly").BitlyClient;
const bitly = new BitlyClient("cfbe9e5decc7f04ac3bffea812a419a1ff4ec4cd");
const validUrl = require("valid-url");
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const Newsletter = require("./models/newsletter");
const Payment = require("./models/payment");
const sendTextRouter = require("./routes/send-text");
const newsletterRouter = require("./routes/newsletter");

const PORT = process.env.PORT || 9000;
const BASE_URL = process.env.DEV_URL;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/newsletter", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use("/send-text", sendTextRouter);
app.use("/newsletter", newsletterRouter);

app.get("/", (req, res) => {
  res.send({ data: "Server is live" });
});

// upload image
app.post("/image-upload", (req, res) => {
  const form = formidable({ multiples: true });

  form.parse(req);

  form.on("fileBegin", (name, file) => {
    file.path = __dirname + "/public/uploads/" + file.name;
  });

  form.on("file", function (name, file) {
    res.json({
      status: 200,
      path: `${BASE_URL}/uploads/${file.name}`,
    });
  });
});

// return user info
app.get("/user-info", (req, res) => {
  Payment.findOne({ id: 1 }, (err, user) => {
    if (user) {
      res.json({ status: 200, user: "found", userData: user });
    } else {
      res.json({ status: 200, user: "not found" });
    }
  });
});

// create newsletter
// app.post("/create", async (req, res) => {
//   // console.log(req.body);
//   const newNewsletter = new Newsletter({
//     newsletterId: req.body.newsletterId,
//     imageUrl: req.body.image,
//     title: req.body.title,
//     description: req.body.description,
//     sampleText: req.body.sampleText,
//     monthlyPrice: "",
//     yearlyPrice: "",
//   });

//   await newNewsletter.save();
//   res.json({ status: 200, message: "success" });
// });

app.get("/get-record/:id", async (req, res) => {
  const newsletter = await Newsletter.findOne({
    newsletterId: req.params.id,
  });

  res.json({ status: 200, message: "success", data: newsletter });
});

// payment
// app.post("/payment", async (req, res) => {
//   console.log(req.body);

//   Payment.findOneAndUpdate(
//     { id: 1 },
//     {
//       monthly: req.body.monthly ? parseFloat(req.body.monthly) : 0,
//       yearly: req.body.yearly ? parseFloat(req.body.yearly) : 0,
//     },
//     (err, result) => {
//       console.log("record updated", result);
//       // res.json({
//       //   status: 200,
//       //   message: "success",
//       // });
//     }
//   );

//   Newsletter.findOneAndUpdate(
//     {
//       newsletterId: req.body.newsletterId,
//     },
//     {
//       monthlyPrice: req.body.monthly,
//       yearlyPrice: req.body.yearly,
//     },
//     (err, record) => {
//       if (!err) {
//         console.log("record", record);
//         res.json({
//           status: 200,
//           message: "success",
//         });
//       }
//       console.log("err", err);
//     }
//   );
// });

// stripe
app.post("/stripe", async (req, res) => {
  // console.log(req.body);
  const response = await stripe.oauth.token({
    grant_type: "authorization_code",
    code: req.body.code,
  });

  Payment.findOneAndUpdate(
    { id: 1 },
    {
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      stripe_user_id: response.stripe_user_id,
    },
    (err, result) => {
      console.log("record updated", result);
      res.json({
        status: 200,
        message: "success",
      });
    }
  );
});

// charge
app.get("/charge", (req, res) => {
  console.log("called");
  Payment.findOne({ id: 1 }, async (err, data) => {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        payment_method_types: ["card"],
        amount: 1000,
        currency: "usd",
      },
      {
        stripeAccount: data.stripe_user_id,
      }
    );

    console.log("paymentIntent", paymentIntent);
  });
  res.json({ status: 200, message: "success" });
});

// short link
app.post("/short-link", async (req, res) => {
  try {
    let link = req.body.link;
    if (link.slice(0, 4) !== "http") {
      console.log("add http in front...");
      link = "http://" + link;
    }
    let shortLink = await shortenUrl(link);
    // console.log("short", shortLink);
    res.json({ status: 200, message: "success", link: shortLink });
  } catch (err) {
    res.json({ status: 200, message: "invalid" });
    console.log("this", err);
  }
});

app.post("/validate-url", (req, res) => {
  let url = req.body.url;
  if (url.slice(0, 4) !== "http") {
    url = "http://" + url;
  }
  let result = validateUrl(url);

  res.json({ status: 200, message: result });
});

app.post("/send-code", async (req, res) => {
  console.log(req.body);

  await client.verify
    .services(TWILIO_SERVICE_SID)
    .verifications.create({
      to: req.body.phoneNumber,
      channel: "sms",
    })
    .then((verification) => {
      console.log("verification", verification);
      res.json({ status: 200, message: "success" });
    })
    .catch((err) => {
      if (err) {
        res.json({ status: 200, message: "invalid no", api_response: err });
      }
    });
});

app.post("/verify-code", async (req, res) => {
  console.log(req.body);

  await client.verify
    .services(TWILIO_SERVICE_SID)
    .verificationChecks.create({
      to: req.body.phoneNumber,
      code: req.body.code,
    })
    .then((verification) => {
      console.log("check", verification);
      res.json({
        status: 200,
        message: "success",
        verifyStatus: verification.status,
      });
    })
    .catch((err) => {
      if (err) {
        console.log(err);
        res.json({
          status: 200,
          message: "invalid code",
          api_response: err,
        });
      }
    });
});

// app.post("/charge-card", async (req, res) => {
//   try {
//     console.log(req.body);

//     const token = req.body.token;
//     console.log("pay value...", req.body.pay.slice(1) + "00");
//     const pay = parseFloat(req.body.pay.slice(1) + "00");
//     const charge = await stripe.charges.create({
//       amount: pay,
//       currency: "usd",
//       description: "Example charge",
//       source: token,
//     });

//     // const customer = await stripe.customers.create({
//     //   email: "ds.sparkle018@gmail.com",
//     //   name: "testing",
//     //   description: "test customer",
//     // });

//     console.log(charge);
//     // console.log(customer);
//     res.json({ status: 200, message: "success", charge });
//   } catch (err) {
//     res.json({ message: "error", error: err });
//   }
// });

async function shortenUrl(url) {
  const response = await bitly.shorten(url);
  // console.log(response);
  return response.link;
}

function validateUrl(url) {
  if (validUrl.isUri(url)) {
    console.log("Looks like an URI");
    return "valid";
  } else {
    console.log("Not a URI");
    return "not-valid";
  }
}

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
