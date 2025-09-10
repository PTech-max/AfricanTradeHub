// TOP OF FILE (if not present yet)
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import { pool } from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

// ensure uploads dir
const uploadDir = path.join(process.cwd(), "backend", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "_" + safe);
  }
});
const upload = multer({ storage });

router.post("/initiate-payment",
router.get("/paystack/callback", async (req, res) => {
  const { reference } = req.query;
  if (!reference) return res.status(400).send("No reference provided");

  try {
    // Verify with Paystack
    const verifyResp = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const status = verifyResp.data.data.status; // expect "success"
    if (status !== "success") return res.status(400).send("Payment not successful");

    // Get pending row
    const [rows] = await pool.query(
      "SELECT * FROM pending_registrations WHERE reference = ?",
      [reference]
    );
    if (!rows.length) return res.status(404).send("Pending registration not found");

    const p = rows[0];

    // Insert into companies
    await pool.query(
      `INSERT INTO companies
       (business_name, reg_number, email, country, business_type, members_info, logo_path, doc_path, subscription_plan, subscription_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        p.business_name, p.reg_number, p.email, p.country, p.business_type,
        p.members_info, p.logo_path, p.doc_path, p.subscription_plan
      ]
    );

    // Delete pending row
    await pool.query("DELETE FROM pending_registrations WHERE id = ?", [p.id]);

    // Redirect user
    return res.redirect(`${process.env.PUBLIC_BASE_URL}/dashboard.html`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Verification error");
  }
});
 
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "businessDoc", maxCount: 1 }]),
  async (req, res) => {
    try {
      const {
        businessName, regNumber, email,
        country, businessType, membersInfo, plan
      } = req.body;

      const logoFile = req.files?.logo?.[0] || null;
      const docFile  = req.files?.businessDoc?.[0] || null;

      // Set your amounts in KOBO (Dollar) or lowest unit for your currency
      const amount = plan === "annual" ? 50 : 50; // example: 10 Dollars vs 50 Dollars

      // Initialize Paystack
      const initResp = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        { email, amount, callback_url: process.env.PAYSTACK_CALLBACK_URL },
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
      );

      const { reference, authorization_url } = initResp.data.data;

      // Save pending registration
      await pool.query(
        `INSERT INTO pending_registrations
         (reference, business_name, reg_number, email, country, business_type, members_info, logo_path, doc_path, subscription_plan)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reference,
          businessName, regNumber, email, country, businessType,
          membersInfo || null,
          logoFile ? `/uploads/${logoFile.filename}` : null,
          docFile ? `/uploads/${docFile.filename}` : null,
          plan || "monthly"
        ]
      );

      res.json({ ok: true, authorization_url });
    } catch (err) {
      console.error(err.response?.data || err.message);
      res.status(500).json({ ok: false, error: "Failed to initiate payment" });
    }
  }
);

export default router;

import express from "express";
import fetch from "node-fetch"; // for API calls
import bodyParser from "body-parser";
// make sure this exists
import paymentsRoutes from "./routes/payments.js";
app.use("/api", paymentsRoutes);

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
