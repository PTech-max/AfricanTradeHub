import express from "express";
import fetch from "node-fetch"; // for API calls
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const PAYSTACK_SECRET = "sk_test_xxxxxxxxxxxxxx"; // your secret key

// Verify payment
app.post("/api/verify-payment", async (req, res) => {
  const { reference } = req.body;

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      // Save to database here
      res.json({ status: "success", data: data.data });
    } else {
      res.json({ status: "failed", data: data.data });
    }

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
// JavaScript Logic
