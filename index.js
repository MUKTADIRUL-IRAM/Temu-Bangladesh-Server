const express = require("express");
const cors = require("cors");
const axios = require("axios");
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
 const serverless = require('serverless-http');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
//console.log("Running in:", process.env.NODE_ENV);


app.use(cors({
  //origin: ['http://localhost:5173',"2nd Url","3rd Url","....","..."]
    // origin: 'https://job-portal-90430.web.app', // Where your React app is running
    origin: ["http://localhost:5173",'https://steady-sable-5c78ac.netlify.app'], // Where your frontend is running
    credentials: true,     // Allow cookies to be shared
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]             
}));


// app.use(cors());cors = cross origin setup
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded());//Have to use it to get SSLCommerz 'Success' response because SSLCommerz sends/receives data in 'application/x-www-form-urlencoded'





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ditdntn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db('Temu_Bangladesh');
    const sampleProductCollection = database.collection('previewProducts');
    const categoriesCollection = database.collection('categories');
    const slidingCollection = database.collection('sliding-section');
    const showCaseProductCollection = database.collection('showcase-products');
    const menClothProductCollection = database.collection('mens-cloth-product');
    const smartHomeCollection = database.collection('smart-home');
    const menShoeCollection = database.collection('mens-shoes');
    const womenShoeCollection = database.collection('women-shoes');
    const womenClothCollection = database.collection('womens-clothing');
    const bISCollection = database.collection('business-industry-science');
    const bagsLuggageCollection = database.collection('bags-luggage');
    const featuredCollection = database.collection('featured');
    const homeKitchenCollection = database.collection('home-kitchen');
    const sportsOutDoorsCollection = database.collection('sports-outdoors');
    const mensClothingCollection = database.collection('mens-clothing');
    const juicerMachineCollection = database.collection('juicer-machine');
    const sofaCollection = database.collection('L-shape-sofa');
    const droneCollection = database.collection('drone');
    const bbqCollection = database.collection('portable-bbq');
    const sneakersCollection = database.collection('casual-sneakers');
    const jacketCollection = database.collection('corduroy-jacket');
    const bikeCollection = database.collection('electric-bike');
    const sofaBedCollection = database.collection('futon-sofa-bed');
    const nintendoCollection = database.collection('nintendo-switch');
    const blenderCollection = database.collection('portable-blender');
    const spiceCollection = database.collection('rotating-spice-rack');
    const smartWatchCollection = database.collection('smartwatch');
    const groomingTrimmingCollection = database.collection('grooming-trimming-set');
    const mensCasualShirtCollection = database.collection('mens-casual-shirt');
    const coffeeMachineCollection = database.collection('coffee-machine');
    const deepFryerCollection = database.collection('deep-fryer');
    const leatherHandbagCollection = database.collection('leather-handbag');
    const longSleeveCollection = database.collection('long-sleeve');
    const reclinerChairCollection = database.collection('recliner-chair');
    const sunGlassCollection = database.collection('uv-protection-sunglass');
    const cottonSleeveCollection = database.collection('cotton-long-sleeve');
    const luxuryWatchCollection = database.collection('ss-watch-men');
    const panCollection = database.collection('non-stick-pan');
    const sandwichCollection = database.collection('e-sandwich-maker');
    const toyCollection = database.collection('toy-airplane');
    const wineBarCollection = database.collection('wooden-wine-bar');
    const bulletFillerCollection = database.collection('bullet-filler');
    const diningTableCollection = database.collection('dining-table-set');
    const bagCollection = database.collection('tote-bag');
    const perfumeCollection = database.collection('premium-women-perfume');
    const paymentCollection = database.collection('payment');

    //jwt token api
    app.post('/jwt',async(req,res)=>{
       const userEmail = req.body;
      //Generating token
      const token = jwt.sign(userEmail,process.env.JWT_ACCESS_SECRET,{expiresIn:"1h"});//jwt.sign(payload,secretKey,{expiresIn:""})
      //Generating cookie
      res.cookie('iram',token,{
        httpOnly:true,
        secure  : isProduction,        //process.env.NODE_ENV === "production"// true only for HTTPS ; Locally, NODE_ENV=development → secure:false, sameSite:lax ; On Vercel, NODE_ENV=production → secure:true, sameSite:none
        sameSite: isProduction ? "none" : "lax",  //process.env.NODE_ENV === "production" ? "none" : "lax"// none for cross-site (prod), lax for local
        path: "/", // cookie visible to all routes
      })
      res.send({token});
    });

    //Clearing token after logout
    app.post('/logout',(req,res)=>{
      res.clearCookie('iram',{
        httpOnly:true,
        secure:isProduction, // false --> to run locally; true --> to run in production level
        sameSite:isProduction ? "none" : "lax", //"lax" --> to run locally; "none" --> to run in production level
        path: "/",
      })
      res.send({ message: 'Cookie cleared, logged out successfully'});
    });

    const verifyJWT = (req,res,next)=>{

      const token = req.cookies?.iram;
     //No token at all
      if(!token)
      {
        console.log('No token');
        return res.status(401).send({message:"Unauthorized access"});
      }

      jwt.verify(token,process.env.JWT_ACCESS_SECRET,(err,decoded)=>{
        //  There is token but not the correct one or expired token
        if(err)
        {
          console.log("Not the correct token : ",err);
          return res.status(401).send({message:"Unauthorized access"});
        }
        console.log("✅ Token verified successfully : ", decoded);
        req.user = decoded;
        next();
      })
    }

    app.post('/new-comments/:id',async(req,res)=>{

       // ✅ Pick the correct collection by name
        const collections = {
          "L-shape-sofa": sofaCollection,
          "drone": droneCollection,
          "toy-airplane": toyCollection,
          "futon-sofa-bed": sofaBedCollection,
          "portable-blender":blenderCollection,
          "bullet-filler":bulletFillerCollection,
          "mens-casual-shirt":mensCasualShirtCollection,
          "casual-sneakers":sneakersCollection,
          "coffee-machine":coffeeMachineCollection,
          "corduroy-jacket":jacketCollection,
          "deep-fryer":deepFryerCollection,
          "dining-table-set":diningTableCollection,
          "electric-bike":bikeCollection,
          "leather-handbag":leatherHandbagCollection,
          "juicer-machine":juicerMachineCollection,
          "cotton-long-sleeve":cottonSleeveCollection,
          "ss-watch-men":luxuryWatchCollection,
          "nintendo-switch":nintendoCollection,
          "non-stick-pan":panCollection,
          "long-sleeve":longSleeveCollection,
          "recliner-chair":reclinerChairCollection,
          "rotating-spice-rack":spiceCollection,
          "e-sandwich-maker":sandwichCollection,
          "smartwatch":smartWatchCollection,
          "uv-protection-sunglass":sunGlassCollection,
          "tote-bag":bagCollection,
          "grooming-trimming-set":groomingTrimmingCollection,
          "wooden-wine-bar":wineBarCollection,
          "premium-women-perfume":perfumeCollection,
          "portable-bbq":bbqCollection,
          "mens-cloth-product":menClothProductCollection
          // add more as needed
      };

       const {id} = req.params;  // product ID from URL
       const{collection,...newComment}= req.body;  // { user_name, date, comment }
        
       //unnecessary line committed in github
        console.log("Searching for product:", id, "inside:", collection);

       const targetCollection = collections[collection];
       if (!targetCollection)
        {
          return res.status(400).send({ success: false, message: "Invalid collection name" });
        }

       try{
            const result = await targetCollection.updateOne(
              { _id  : new ObjectId(id)},// find the correct product
              {$push : {review : newComment}}// add comment to review array
            );

            if(result.modifiedCount > 0)
            {
              res.send({success:true,insertedId : id});
            }
            else
            {
              res.status(404).send({success:false,message:'Product not found'});
            }
       }
       catch(error){
          console.log("Error adding comment:", error);
          res.status(500).send({success:false,message:"Server Error"});
        }

    });

    //Step-1 -> Initialize-Payment
    app.post("/create-ssl-payment",async(req,res)=>{
      const payment = req.body;
      console.log('PaymentInfo : ',payment);
      
      //Generating Transaction ID
      const trxId = new ObjectId().toString();

      payment.transactionId = trxId;
      
      //This is a form data packet for SSLCommerz
      const initiate = {
        store_id:"temub697dc7a736dab",
        store_passwd:"temub697dc7a736dab@ssl",
        total_amount: payment.price,
        currency: 'BDT',
        tran_id: trxId, // use unique tran_id for each api call
        success_url: 'http://localhost:5000/success-payment',
        fail_url: 'http://localhost:5173/fail',
        cancel_url: 'http://localhost:5173/cancel',
        ipn_url: 'http://localhost:5000/ipn-success-payment',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: 'Customer Name',
        cus_email: `${payment.email}`,//Retrieving information from payment
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };

      const encodedInitiate = new URLSearchParams(initiate).toString();
      
      //Step-2 -> This is where Backend talks to SSLCommerz and waits for response.SSLCommerz sends back "iniResponse.data" as response
      const iniResponse = await axios({
          url:"https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
          method:"POST",
          data : encodedInitiate,
          headers:{
            "Content-Type" : "application/x-www-form-urlencoded",
          },
        });

        const saveData = await paymentCollection.insertOne(payment);//Stoing Payment in Database
        //Step-3 -> Get the Url for Payment
        const gateWayUrl = iniResponse?.data?.GatewayPageURL
   
        console.log("gateWayUrl : ",gateWayUrl);
        //Step-4 -> Redirect the customer to the gateway
        res.send({gateWayUrl});
      

    });


    //Success-Payment
     app.post("/success-payment",async(req,res)=>{
      //Step-5 -> Success payment data
      const paymentSuccess = req.body;
      console.log('Payment_Success_Info : ',paymentSuccess);

      //Step-6 -> Validation
      const isValidPayment = await axios.get(`https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${paymentSuccess.val_id}&store_id=temub697dc7a736dab&store_passwd=temub697dc7a736dab@ssl`);
      console.log("isValidPayment : ",isValidPayment);

      if(isValidPayment?.data?.status !== 'VALID')
      {
        return res.send({message : "Invalid payment"});
      }

      //Step-7 -> update the "Status" in paymentCollection in database 
      const updatePayment = await paymentCollection.updateOne({transactionId:isValidPayment.data.tran_id},
        {
          $set:{
            status:"success",
          },
        }
      );

      console.log("UpdatePayment : ",updatePayment);

      res.redirect('http://localhost:5173/success');
      

      
    });


    app.get('/sampleproducts',async(req,res)=>{

      const cursor = sampleProductCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/categories',async(req,res)=>{

      const cursor = categoriesCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/sliding-section',async(req,res)=>{

      const cursor = slidingCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/showcase-products',verifyJWT,async(req,res)=>{
      console.log('Cookies received:', req.cookies); // 👈 debug line
      console.log("User : ",req.user);
      
      const cursor = showCaseProductCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/mens-cloth-product',async(req,res)=>{

      const cursor = menClothProductCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/smart-home',async(req,res)=>{

      const cursor = smartHomeCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/mens-shoes',async(req,res)=>{

      const cursor = menShoeCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/women-shoes',async(req,res)=>{

      const cursor = womenShoeCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/womens-clothing',async(req,res)=>{

      const cursor = womenClothCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/business-industry-science',async(req,res)=>{

      const cursor = bISCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/bags-luggage',async(req,res)=>{

      const cursor = bagsLuggageCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/juicer-machine',async(req,res)=>{

      const cursor = juicerMachineCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/L-shape-sofa',async(req,res)=>{

      const cursor = sofaCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/drone',async(req,res)=>{

      const cursor = droneCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/portable-bbq',async(req,res)=>{

      const cursor = bbqCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    
    app.get('/casual-sneakers',async(req,res)=>{

      const cursor = sneakersCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/corduroy-jacket',async(req,res)=>{

      const cursor = jacketCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/electric-bike',async(req,res)=>{

      const cursor = bikeCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/futon-sofa-bed',async(req,res)=>{

      const cursor = sofaBedCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/nintendo-switch',async(req,res)=>{

      const cursor = nintendoCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/portable-blender',async(req,res)=>{

      const cursor = blenderCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/rotating-spice-rack',async(req,res)=>{

      const cursor = spiceCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/smartwatch',async(req,res)=>{

      const cursor = smartWatchCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/grooming-trimming-set',async(req,res)=>{

      const cursor = groomingTrimmingCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/mens-casual-shirt',async(req,res)=>{

      const cursor = mensCasualShirtCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/coffee-machine',async(req,res)=>{

      const cursor = coffeeMachineCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/deep-fryer',async(req,res)=>{

      const cursor = deepFryerCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/leather-handbag',async(req,res)=>{

      const cursor = leatherHandbagCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    
    app.get('/long-sleeve',async(req,res)=>{

      const cursor = longSleeveCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/recliner-chair',async(req,res)=>{

      const cursor = reclinerChairCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/uv-protection-sunglass',async(req,res)=>{

      const cursor = sunGlassCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/cotton-long-sleeve',async(req,res)=>{

      const cursor = cottonSleeveCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/ss-watch-men',async(req,res)=>{

      const cursor = luxuryWatchCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/non-stick-pan',async(req,res)=>{

      const cursor = panCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/e-sandwich-maker',async(req,res)=>{

      const cursor = sandwichCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/toy-airplane',async(req,res)=>{

      const cursor = toyCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/wooden-wine-bar',async(req,res)=>{

      const cursor = wineBarCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/bullet-filler',async(req,res)=>{

      const cursor = bulletFillerCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/dining-table-set',async(req,res)=>{

      const cursor = diningTableCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/tote-bag',async(req,res)=>{

      const cursor = bagCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/premium-women-perfume',async(req,res)=>{

      const cursor = perfumeCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/featured',async(req,res)=>{

      const cursor = featuredCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/home-kitchen',async(req,res)=>{

      const cursor = homeKitchenCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/sports-outdoors',async(req,res)=>{

      const cursor = sportsOutDoorsCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });

    app.get('/mens-clothing',async(req,res)=>{

      const cursor = mensClothingCollection.find();
      const result = await cursor.toArray();
      res.send(result);

    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("Temu Server is working");
});

app.listen(port,()=>{
    console.log('Temu Server is working port : ',port);
});

  // module.exports = app;

 
  //module.exports.handler = serverless(app);
  