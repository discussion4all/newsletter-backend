const express = require("express");
const router = express.Router();
const validUrl = require("valid-url");
const BitlyClient = require("bitly").BitlyClient;

const bitly = new BitlyClient(process.env.BITLY_KEY);

// CHECK URL VALIDITY
router.post("/validate", (req, res) => {
  let url = req.body.url;
  if (url.slice(0, 4) !== "http") {
    url = "http://" + url;
  }
  let result = validateUrl(url);

  res.json({ status: 200, message: result });
});

// SHORTEN PASSED URL
router.post("/shorten", async (req, res) => {
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

function validateUrl(url) {
  if (validUrl.isUri(url)) {
    return "valid";
  } else {
    return "not-valid";
  }
}

async function shortenUrl(url) {
  const response = await bitly.shorten(url);
  // console.log(response);
  return response.link;
}

module.exports = router;
