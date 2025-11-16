// /api/[...slug].js
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

let client; // lazy MongoDB client

async function getClient() {
  if (!client) {
    client = new MongoClient(process.env.DB_URI || `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ditdntn.mongodb.net/?retryWrites=true&w=majority`, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    });
    await client.connect();
  }
  return client;
}

// JWT verification helper
function verifyJWT(token) {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    return null;
  }
}

// Main handler
module.exports = async (req, res) => {
  // Enable CORS
  const corsOptions = {
    origin: ["http://localhost:5173", "https://temu-bangladesh.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  cors(corsOptions)(req, res, async () => {
    // Parse cookies
    cookieParser()(req, res, async () => {
      const slug = req.query.slug; // slug = array of path parts
      const path = slug ? slug.join("/") : "";

      const client = await getClient();
      const db = client.db("Temu_Bangladesh");

      // Map collection names
      const collections = {
        "previewProducts": db.collection("previewProducts"),
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
        "juicer-machine": db.collection("juicer-machine"),
        "L-shape-sofa": db.collection("L-shape-sofa"),
        "drone": db.collection("drone"),
        "portable-bbq": db.collection("portable-bbq"),
        "casual-sneakers": db.collection("casual-sneakers"),
        "corduroy-jacket": db.collection("corduroy-jacket"),
        "electric-bike": db.collection("electric-bike"),
        "futon-sofa-bed": db.collection("futon-sofa-bed"),
        "nintendo-switch": db.collection("nintendo-switch"),
        "portable-blender": db.collection("portable-blender"),
        "rotating-spice-rack": db.collection("rotating-spice-rack"),
        "smartwatch": db.collection("smartwatch"),
        "grooming-trimming-set": db.collection("grooming-trimming-set"),
        "mens-casual-shirt": db.collection("mens-casual-shirt"),
        "coffee-machine": db.collection("coffee-machine"),
        "deep-fryer": db.collection("deep-fryer"),
        "leather-handbag": db.collection("leather-handbag"),
        "long-sleeve": db.collection("long-sleeve"),
        "recliner-chair": db.collection("recliner-chair"),
        "uv-protection-sunglass": db.collection("uv-protection-sunglass"),
        "cotton-long-sleeve": db.collection("cotton-long-sleeve"),
        "ss-watch-men": db.collection("ss-watch-men"),
        "non-stick-pan": db.collection("non-stick-pan"),
        "e-sandwich-maker": db.collection("e-sandwich-maker"),
        "toy-airplane": db.collection("toy-airplane"),
        "wooden-wine-bar": db.collection("wooden-wine-bar"),
        "bullet-filler": db.collection("bullet-filler"),
        "dining-table-set": db.collection("dining-table-set"),
        "tote-bag": db.collection("tote-bag"),
        "premium-women-perfume": db.collection("premium-women-perfume"),
        "bbq": db.collection("portable-bbq")
      };

      try {
        // ===== JWT route =====
        if (path === "jwt" && req.method === "POST") {
          const userEmail = req.body;
          const token = jwt.sign(userEmail, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
          res.setHeader("Set-Cookie", `iram=${token}; HttpOnly; Path=/; SameSite=${process.env.NODE_ENV === "production" ? "None" : "Lax"}; Secure=${process.env.NODE_ENV === "production"}`);
          return res.status(200).json({ token });
        }

        // ===== Logout route =====
        if (path === "logout" && req.method === "POST") {
          res.setHeader("Set-Cookie", `iram=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`);
          return res.status(200).json({ message: "Cookie cleared, logged out successfully" });
        }

        // ===== New comment route =====
        if (path.startsWith("new-comments") && req.method === "POST") {
          const token = req.cookies?.iram;
          if (!token || !verifyJWT(token)) return res.status(401).json({ message: "Unauthorized access" });

          const id = req.query.slug[1]; // /new-comments/:id
          const { collection, ...newComment } = req.body;
          const targetCollection = collections[collection];
          if (!targetCollection) return res.status(400).json({ success: false, message: "Invalid collection name" });

          const result = await targetCollection.updateOne(
            { _id: new ObjectId(id) },
            { $push: { review: newComment } }
          );
          if (result.modifiedCount > 0) return res.status(200).json({ success: true, insertedId: id });
          return res.status(404).json({ success: false, message: "Product not found" });
        }

        // ===== GET collections =====
        if (req.method === "GET" && collections[path]) {
          if (path === "showcase-products") {
            const token = req.cookies?.iram;
            if (!token || !verifyJWT(token)) return res.status(401).json({ message: "Unauthorized access" });
          }
          const data = await collections[path].find().toArray();
          return res.status(200).json(data);
        }

        // ===== Default root =====
        if (path === "") {
          return res.status(200).send("Temu Server is working");
        }

        // Route not found
        return res.status(404).json({ message: "Route not found" });
      } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    });
  });
};
