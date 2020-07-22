const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const formidable = require("formidable");
const mongoose = require("mongoose");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY, {
//   apiVersion: "",
// });

const sendTextRouter = require("./routes/send-text");
const newsletterRouter = require("./routes/newsletter");
const verificationCodeRouter = require("./routes/verification-code");
const linkRouter = require("./routes/link");
const stripeRouter = require("./routes/stripe");
const scheduleTexts = require("./utils/scheduleTexts");

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
app.use("/verification-code", verificationCodeRouter);
app.use("/link", linkRouter);
app.use("/stripe", stripeRouter);

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

// // stripe
// app.post("/stripe", async (req, res) => {
//   const response = await stripe.oauth.token({
//     grant_type: "authorization_code",
//     code: req.body.code,
//   });

//   res.json({
//     status: 200,
//     message: "success",
//   });
// });

// charge
// app.get("/charge", async (req, res) => {
//   const paymentIntent = await stripe.paymentIntents.create(
//     {
//       payment_method_types: ["card"],
//       amount: 1000,
//       currency: "usd",
//     },
//     {
//       stripeAccount: data.stripe_user_id,
//     }
//   );

//   console.log("paymentIntent", paymentIntent);

//   res.json({ status: 200, message: "success" });
// });

scheduleTexts();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
