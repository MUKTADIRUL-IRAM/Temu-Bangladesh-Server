// File: /api/[...slug].js
// Copy this file as-is into your repo at /api/[...slug].js

const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const serverless = require("serverless-http");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

// --- CONFIG ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://temu-bangladesh.netlify.app"
];

const DB_URI = process.env.DB_URI || `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ditdntn.mongodb.net/?retryWrites=true&w=majority`;

// --- Manual CORS middleware (handles preflight + credentials) ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Body + cookie parsing
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// --- Lazy MongoDB client (caching across invocations) ---
let cachedClient = null;
let cachedDb = null;
async function getDb() {
  if (cachedDb && cachedClient) return { client: cachedClient, db: cachedDb };

  const client = new MongoClient(DB_URI, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });

  await client.connect();
  const db = client.db("Temu_Bangladesh");

  cachedClient = client;
  cachedDb = db;
  console.log("MongoDB connected (lazy).");
  return { client, db };
}

// --- Helper: verify token (returns payload or null) ---
function verifyJWTTokenFromCookie(req) {
  const token = req.cookies?.iram;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

// --- Route handling ---
// Important: using "app" with serverless-http so this file can handle all /api/* paths
app.post("/jwt", async (req, res) => {
  try {
    const userEmail = req.body;
    if (!userEmail) return res.status(400).json({ message: "Invalid body" });

    const token = jwt.sign(userEmail, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });

    // Set cookie for cross-site: SameSite none + Secure in production
    const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
    const secure = process.env.NODE_ENV === "production";

    res.cookie("iram", token, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/"
    });

    return res.status(200).json({ token });
  } catch (err) {
    console.error("JWT error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/logout", async (req, res) => {
  // Clear cookie (Max-Age=0)
  const sameSite = process.env.NODE_ENV === "production" ? "None" : "Lax";
  const secure = process.env.NODE_ENV === "production";
  res.clearCookie("iram", { httpOnly: true, secure, sameSite, path: "/" });
  return res.status(200).json({ message: "Cookie cleared, logged out successfully" });
});

app.post("/new-comments/:id", async (req, res) => {
  try {
    const decoded = verifyJWTTokenFromCookie(req);
    if (!decoded) return res.status(401).json({ message: "Unauthorized access" });

    const { id } = req.params;
    const { collection, ...newComment } = req.body;
    if (!collection) return res.status(400).json({ success: false, message: "Missing collection" });

    const { db } = await getDb();
    const collectionsMap = {
      "L-shape-sofa": db.collection("L-shape-sofa"),
      "drone": db.collection("drone"),
      "toy-airplane": db.collection("toy-airplane"),
      "futon-sofa-bed": db.collection("futon-sofa-bed"),
      "portable-blender": db.collection("portable-blender"),
      "bullet-filler": db.collection("bullet-filler"),
      "mens-casual-shirt": db.collection("mens-casual-shirt"),
      "casual-sneakers": db.collection("casual-sneakers"),
      "coffee-machine": db.collection("coffee-machine"),
      "corduroy-jacket": db.collection("corduroy-jacket"),
      "deep-fryer": db.collection("deep-fryer"),
      "dining-table-set": db.collection("dining-table-set"),
      "electric-bike": db.collection("electric-bike"),
      "leather-handbag": db.collection("leather-handbag"),
      "juicer-machine": db.collection("juicer-machine"),
      "cotton-long-sleeve": db.collection("cotton-long-sleeve"),
      "ss-watch-men": db.collection("ss-watch-men"),
      "nintendo-switch": db.collection("nintendo-switch"),
      "non-stick-pan": db.collection("non-stick-pan"),
      "long-sleeve": db.collection("long-sleeve"),
      "recliner-chair": db.collection("recliner-chair"),
      "rotating-spice-rack": db.collection("rotating-spice-rack"),
      "e-sandwich-maker": db.collection("e-sandwich-maker"),
      "smartwatch": db.collection("smartwatch"),
      "uv-protection-sunglass": db.collection("uv-protection-sunglass"),
      "tote-bag": db.collection("tote-bag"),
      "grooming-trimming-set": db.collection("grooming-trimming-set"),
      "wooden-wine-bar": db.collection("wooden-wine-bar"),
      "premium-women-perfume": db.collection("premium-women-perfume"),
      "portable-bbq": db.collection("portable-bbq")
      // add more mappings if you need
    };

    const targetCollection = collectionsMap[collection];
    if (!targetCollection) return res.status(400).json({ success: false, message: "Invalid collection name" });

    const result = await targetCollection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { review: newComment } }
    );

    if (result.modifiedCount > 0) return res.status(200).json({ success: true, insertedId: id });
    return res.status(404).json({ success: false, message: "Product not found" });
  } catch (err) {
    console.error("new-comments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Utility: return list of collection names mapped to DB collection object (for GET endpoints)
function collectionsMapFromDb(db) {
  return {
    "sampleproducts": db.collection("previewProducts"),
    "categories": db.collection("categories"),
    "sliding-section": db.collection("sliding-section"),
    "showcase-products": db.collection("showcase-products"),
    "mens-cloth-product": db.collection("mens-cloth-product"),
    "smart-home": db.collection("smart-home"),
    "mens-shoes": db.collection("mens-shoes"),
    "women-shoes": db.collection("women-shoes"),
    "womens-clothing": db.collection("womens-clothing"),
    "business-industry-science": db.collection("business-industry-science"),
    "bags-luggage": db.collection("bags-luggage"),
    "featured": db.collection("featured"),
    "home-kitchen": db.collection("home-kitchen"),
    "sports-outdoors": db.collection("sports-outdoors"),
    "mens-clothing": db.collection("mens-clothing"),
    // add more mappings if needed...
  };
}

// GET endpoints for collections (unauthenticated except showcase-products)
app.get("/:collectionName", async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { db } = await getDb();

    const map = collectionsMapFromDb(db);

    // showcase-products requires JWT
    if (collectionName === "showcase-products") {
      const decoded = verifyJWTTokenFromCookie(req);
      if (!decoded) return res.status(401).json({ message: "Unauthorized access" });
      // If authorized, use the correct collection from DB
      const data = await db.collection("showcase-products").find().toArray();
      return res.status(200).json(data);
    }

    const collection = map[collectionName];
    if (!collection) return res.status(404).json({ message: "Collection not found" });

    const data = await collection.find().toArray();
    return res.status(200).json(data);
  } catch (err) {
    console.error("GET collection error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Root/test
app.get("/", (req, res) => {
  return res.status(200).send("Temu Server is working");
});

// ----- Export handler for Vercel -----
// Important: export serverless(app) as module.exports so Vercel invokes this file for /api/* routes
module.exports = serverless(app);
