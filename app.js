const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const formidable = require("formidable");
const mongoose = require("mongoose");
const stripe = require("stripe")("sk_test_nx09k6MnBsuJlf2zxqiELTtU006U2u3c6K", {
  apiVersion: "",
});
const BitlyClient = require("bitly").BitlyClient;
const bitly = new BitlyClient("cfbe9e5decc7f04ac3bffea812a419a1ff4ec4cd");
const validUrl = require("valid-url");
const TWILIO_ACCOUNT_SID = "AC71d24513140aedd57cb3770cca6267f0";
const TWILIO_AUTH_TOKEN = "1b9264c7f64be1cfdb89b0784fe86f02";
const TWILIO_SERVICE_SID = "VA0cbea0c0bf4afd8dbf85c4b2f726d1a6";
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const Newsletter = require("./models/newsletter");
const Payment = require("./models/payment");

const PORT = process.env.PORT || 9000;
const PROD_URL = "http://ec2-34-224-95-146.compute-1.amazonaws.com:9000/";
const DEV_URL = "http://localhost:9000";
const BASE_URL = DEV_URL;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/newsletter", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
app.post("/create", async (req, res) => {
  // console.log(req.body);
  const newNewsletter = new Newsletter({
    imageUrl: req.body.image,
    title: req.body.title,
    description: req.body.description,
    sampleText: req.body.sampleText,
  });

  await newNewsletter.save();
  res.json({ status: 200, message: "success" });
});

// payment
app.post("/payment", async (req, res) => {
  console.log(req.body);

  Payment.findOneAndUpdate(
    { id: 1 },
    {
      monthly: req.body.monthly ? parseFloat(req.body.monthly) : 0,
      yearly: req.body.yearly ? parseFloat(req.body.yearly) : 0,
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
  console.log(req.body.link);
  let shortLink = await shortenUrl(req.body.link);
  res.json({ status: 200, message: "success", link: shortLink });
});

app.post("/validate-url", (req, res) => {
  let result = validateUrl(req.body.url);
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
        res.json({ status: 200, message: "invalid no" });
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
        });
      }
    });
});

async function shortenUrl(url) {
  const response = await bitly.shorten(url);
  console.log(response);
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
