// api/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const serverless = require("serverless-http");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://temu-bangladesh.netlify.app"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// MongoDB Setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ditdntn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1 } });

let db;
let collections = {};

const collectionNames = [
  "previewProducts",
  "categories",
  "sliding-section",
  "showcase-products",
  "mens-cloth-product",
  "smart-home",
  "mens-shoes",
  "women-shoes",
  "womens-clothing",
  "business-industry-science",
  "bags-luggage",
  "featured",
  "home-kitchen",
  "sports-outdoors",
  "mens-clothing",
  "juicer-machine",
  "L-shape-sofa",
  "drone",
  "portable-bbq",
  "casual-sneakers",
  "corduroy-jacket",
  "electric-bike",
  "futon-sofa-bed",
  "nintendo-switch",
  "portable-blender",
  "rotating-spice-rack",
  "smartwatch",
  "grooming-trimming-set",
  "mens-casual-shirt",
  "coffee-machine",
  "deep-fryer",
  "leather-handbag",
  "long-sleeve",
  "recliner-chair",
  "uv-protection-sunglass",
  "cotton-long-sleeve",
  "ss-watch-men",
  "non-stick-pan",
  "e-sandwich-maker",
  "toy-airplane",
  "wooden-wine-bar",
  "bullet-filler",
  "dining-table-set",
  "tote-bag",
  "premium-women-perfume",
];

async function initDB() {
  if (!client.isConnected?.()) await client.connect();
  db = client.db("Temu_Bangladesh");

  collectionNames.forEach((name) => {
    collections[name] = db.collection(name);
  });

  console.log("✅ MongoDB initialized");
}

initDB().catch((err) => console.error("MongoDB init error:", err));

// JWT middleware
const verifyJWT = (req, res, next) => {
  const token = req.cookies?.iram;
  if (!token) return res.status(401).send({ message: "Unauthorized access" });

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Unauthorized access" });
    req.user = decoded;
    next();
  });
};

// JWT routes
app.post("/jwt", (req, res) => {
  const userEmail = req.body;
  const token = jwt.sign(userEmail, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });

  res.cookie("iram", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.send({ token });
});

app.post("/logout", (req, res) => {
  res.clearCookie("iram", { httpOnly: true, secure: true, sameSite: "none" });
  res.send({ message: "Cookie cleared, logged out successfully" });
});

// Test route
app.get("/ping", (req, res) => res.send("pong"));

// Dynamically create GET routes for all collections
collectionNames.forEach((name) => {
  const path = `/${name}`;
  if (name === "showcase-products") {
    // protect this route with JWT
    app.get(path, verifyJWT, async (req, res) => {
      try {
        if (!collections[name]) await initDB();
        const result = await collections[name].find().toArray();
        res.send(result);
      } catch (err) {
        console.error(`Error fetching ${name}:`, err);
        res.status(500).send({ error: "Server error" });
      }
    });
  } else {
    app.get(path, async (req, res) => {
      try {
        if (!collections[name]) await initDB();
        const result = await collections[name].find().toArray();
        res.send(result);
      } catch (err) {
        console.error(`Error fetching ${name}:`, err);
        res.status(500).send({ error: "Server error" });
      }
    });
  }
});

// Generic POST route for adding comments
app.post("/new-comments/:id", async (req, res) => {
  const { id } = req.params;
  const { collection, ...newComment } = req.body;

  if (!collections[collection]) return res.status(400).send({ success: false, message: "Invalid collection name" });

  try {
    const result = await collections[collection].updateOne(
      { _id: new ObjectId(id) },
      { $push: { review: newComment } }
    );
    if (result.modifiedCount > 0) res.send({ success: true, insertedId: id });
    else res.status(404).send({ success: false, message: "Product not found" });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});

// Root route
app.get("/", (req, res) => res.send("Temu Server is working"));

module.exports.handler = serverless(app);
