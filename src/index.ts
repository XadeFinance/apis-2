import express from "express";
import axios from 'axios';
import * as dotenv from 'dotenv';
var admin = require("firebase-admin");
let contractAbi = require('./contractAbi')
var serviceAccount = require("./serviceAccount.json");
const CryptoJS = require("crypto-js");

dotenv.config()
function decryptAESObjectMiddleware(req:any, res:any, next:any) {
  const key = req.body.key; // assuming the encrypted string is passed as a query parameter

  if (key != process.env.API_KEY) {
    return res.status(400).json({ error: "No encrypted string provided" });
  }
  next();
}

// const contractAbi = require('./contractAbi')
// Setup: npm install alchemy-sdk
// Github: https://github.com/alchemyplatform/alchemy-sdk-js
import { Alchemy, Network } from "alchemy-sdk";
import{ ethers }from 'ethers'
// authToken is required to use Notify APIs. Found on the top right corner of
// https://dashboard.alchemy.com/notify.
const settings = {
  authToken: process.env.AUTH_TOKEN,
  network: Network.POLYGONZKEVM_MAINNET, // Replace with your network.
};

const settingstest = {
  authToken: process.env.AUTH_TOKEN,
  network: Network.POLYGONZKEVM_TESTNET, // Replace with your network.
};


var bodyParser = require('body-parser');
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateShortId(): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idLength = 10;
  let id = '';

  for (let i = 0; i < idLength; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    id += alphabet[randomIndex];
  }

  return id;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),

});

const senderMessages = [
  "Congratulations! You just sent a payment and made someone's day (and wallet) a little bit happier! We hope you didn't accidentally send it to your ex or that Nigerian prince who keeps emailing you",
  "You did it! You managed to pay for something without getting lost in a labyrinth of online forms and security questions. Celebrate with a victory dance!",
  "Attention! Your payment has been sent faster than a cheetah chasing its prey! Don't worry, it's not a mistake - you just couldn't bear to hold onto your money any longer. Now go forth and spend it like a boss"
]


const mongoose = require('mongoose')

const DeviceTokenSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  deviceToken: [{ type: String, required: true}],
  points: { type: Number, default: 0 },
  shortid: { type: String, default: () => { generateShortId() } },
  referrals: { type: String, default: 0 }
});

const User = mongoose.model('devicetoken', DeviceTokenSchema);


import { getRequiredEnvVar, setDefaultEnvVar } from "./envHelpers";
import {
  addAlchemyContextToRequest,
  validateAlchemySignature,
  AlchemyWebhookEvent,
} from "./webhooksUtil";
// import { send } from "process";

async function main(): Promise<void> {
  const app = express();
  mongoose.connect("mongodb://127.0.0.1:27017/devicetokens", {
    useNewUrlParser: true,
  })

  setDefaultEnvVar("DATABASE_URL", "mongodb://127.0.0.1:27017/devicetokens");

  const db = mongoose.connection
  db.on('error', (error: any) => console.error(error))
  db.once('open', () => console.log('Connected to mongoose'))
  setDefaultEnvVar("PORT", "4000");
  setDefaultEnvVar("HOST", "0.0.0.0");
  setDefaultEnvVar("SIGNING_KEY", "whsec_O8iFY5eJDnTuNxUF9KxesVkW");
  const port = Number(getRequiredEnvVar("PORT"));
  const host = getRequiredEnvVar("HOST");
  const signingKey = getRequiredEnvVar("SIGNING_KEY");
  // Middleware needed to validate the alchemy signature
  // app.use(
  //   express.json({
  //     verify: addAlchemyContextToRequest,
  //   })
  // );

  // app.use(validateAlchemySignature(signingKey));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  // Register handler for Alchemy Notify webhook events
  // TODO: update to your own webhook path
  app.post('/points', decryptAESObjectMiddleware,async (req, res) => {
    const { userId, transactionAmount } = req.body;

    try {
      const user = await User.findOne({ walletAddress: userId });
      if (!user) {
        res.status(404).send({ points: 'User not found' });
      } else {
        const newPoints = user.points + Math.ceil(transactionAmount) * 20;
        await user.updateOne({ points: newPoints });
        await user.save();
        res.status(200).send({ points: newPoints });
      }
    } catch (err) {
      res.status(500).send(err);
    }
  });

  app.post("/mainnet", async (req: any, res: any) => {

    try {
      const webhookEvent = req.body;
      console.log(webhookEvent.event.activity);

      // Do stuff with with webhook event here!
      console.log(`Processing webhook event id: ${webhookEvent.id}`);
      const { fromAddress, toAddress, asset, value } = webhookEvent.event.activity[0];
      if (asset !== "USDC") return res.send("madarjhaat!");
      const fromUser = await User.findOne({ walletAddress: fromAddress })
      //const response = await axios.get(`https://api-testnet.polygonscan.com/api?module=account&action=tokentx&contractaddress=0xA3C957f5119eF3304c69dBB61d878798B3F239D9&address=${fromAddress}&page=1&offset=1&sort=desc&apikey=26UDEN3Z37KX5V7PS9UMGHU11WAJ38RZ57`)
      //const toAddress = webhookEvent.event.activi
      console.log("toAddr", toAddress);
      //const value = response.data.result[0].value;
      const toUser = await User.findOne({ walletAddress: toAddress })
      console.log(toUser);
      let senderName = fromAddress, receiverName = toAddress;
      // fetch('https://api-testnet.polygonscan.com/api?module=account&action=tokentx&contractaddress=0xA3C957f5119eF3304c69dBB61d878798B3F239D9&address=0x1a2EAF515a6ca05bfab9bf3d9850ea29e5C7882E&page=1&offset=1&sort=desc&apikey=26UDEN3Z37KX5V7PS9UMGHU11WAJ38RZ57')
      console.log("till here also", fromUser + " " + toUser)
      
      const receiverMessages = [
        `Alert! Alert! ${senderName.substring(0, 10)}... has just bestowed upon you the grand sum of ${value}. You are now officially richer than your neighbor's cat who has been living off of premium canned food. Congratulations!`,
        `Woohoo! You've just received a payment of ${value} from ${receiverName.substring(0, 10)}..., who clearly understands the value of your awesomeness. Time to celebrate with a victory dance and maybe a little online shopping spree (responsibly, of course). Thanks, ${senderName}, you're the real MVP!`,

      ]

      console.log("working till here ig", toUser);
      // Be sure to respond with 200 when you successfully process the event
  
      if (toUser) {
        for (let i = 0; i < toUser.deviceToken.length; i++) {
          console.log("this must be working", toUser.deviceToken[i])
          // Be sure to respond with 200 when you successfully process the event
          const message2 = {
            notification: {
              title: 'New Transaction received',
              body: receiverMessages[getRandomInt(0, 1)]
            },
            token: toUser.deviceToken[i]
          };
          try {
          const huh2 = await admin.messaging().send(message2);

          console.log(huh2)
          }
          catch(e)
          {
          console.log(e)
          }
        }
      }
      res.send("Alchemy Notify is the best!");
    }
    catch (e) {
      console.log(e)
      res.send("error in try block")
    }
  });
app.post("/testnet", async (req: any, res: any) => {

    try {
      const webhookEvent = req.body;
      console.log(webhookEvent.event.activity);

      // Do stuff with with webhook event here!
      console.log(`Processing webhook event id: ${webhookEvent.id}`);
      const { fromAddress, toAddress, asset, value } = webhookEvent.event.activity[0];
      if (asset !== "XUSD") return res.send("madarjhaat!");
      const fromUser = await User.findOne({ walletAddress: fromAddress })
      //const response = await axios.get(`https://api-testnet.polygonscan.com/api?module=account&action=tokentx&contractaddress=0xA3C957f5119eF3304c69dBB61d878798B3F239D9&address=${fromAddress}&page=1&offset=1&sort=desc&apikey=26UDEN3Z37KX5V7PS9UMGHU11WAJ38RZ57`)
      //const toAddress = webhookEvent.event.activi
      console.log("toAddr", toAddress);
      //const value = response.data.result[0].value;
      const toUser = await User.findOne({ walletAddress: toAddress })
      console.log(toUser);
      let senderName = fromAddress, receiverName = toAddress;
      // fetch('https://api-testnet.polygonscan.com/api?module=account&action=tokentx&contractaddress=0xA3C957f5119eF3304c69dBB61d878798B3F239D9&address=0x1a2EAF515a6ca05bfab9bf3d9850ea29e5C7882E&page=1&offset=1&sort=desc&apikey=26UDEN3Z37KX5V7PS9UMGHU11WAJ38RZ57')
      console.log("till here also", fromUser + " " + toUser)
      
      const receiverMessages = [
        `Alert! Alert! ${senderName.substring(0, 10)}... has just bestowed upon you the grand sum of ${value}. You are now officially richer than your neighbor's cat who has been living off of premium canned food. Congratulations!`,
        `Woohoo! You've just received a payment of ${value} from ${receiverName.substring(0, 10)}..., who clearly understands the value of your awesomeness. Time to celebrate with a victory dance and maybe a little online shopping spree (responsibly, of course). Thanks, ${senderName}, you're the real MVP!`,

      ]

      console.log("working till here ig", toUser);
      // Be sure to respond with 200 when you successfully process the event
  
      if (toUser) {
        for (let i = 0; i < toUser.deviceToken.length; i++) {
          console.log("this must be working", toUser.deviceToken[i])
          // Be sure to respond with 200 when you successfully process the event
          const message2 = {
            notification: {
              title: 'New Transaction received',
              body: receiverMessages[getRandomInt(0,1)]
            },
            token: toUser.deviceToken[i]
          };
          try {
          const huh2 = await admin.messaging().send(message2);

          console.log(huh2)
          }
          catch(e)
          {
          console.log(e)
          }
        }
      }
      res.send("Alchemy Notify is the best!");
    }
    catch (e) {
      console.log(e)
      res.send("error in try block")
    }
  });
  app.post('/registerDevice',decryptAESObjectMiddleware, async (req: any, res: any) => {
    try {
      const alchemy = new Alchemy(settings);

      const { walletAddress, deviceToken } = req.body;

      // Updating Address Activity Webhook: add/remove addresses
   
      await alchemy.notify.updateWebhook("wh_c96f858nxr2hlq2n", {
        addAddresses: [
          walletAddress,
        ],
        removeAddresses: [],
      });
     const alchemy2 = new Alchemy(settingstest);
	await alchemy2.notify.updateWebhook("wh_csx8jtq2dd1sjc6n", {
        addAddresses: [
          walletAddress,
        ],
        removeAddresses: [],
      });
        
      console.log("working till here");

      const existingUser = await User.findOne({ walletAddress });
      if (existingUser) {

        if (!existingUser.deviceToken.includes(deviceToken))
        {
          existingUser.deviceToken.push(deviceToken);
        await existingUser.save();
        }

        return res.status(201).json({ message: 'Device token altered' });
      }
      else {
      console.log("this is also working");
        const user = new User({
           walletAddress, deviceToken:[deviceToken], points: 0, referrals: '0'
        });
        await user.save();
        return res.status(201).json({ message: 'Device token registered' });
      }

    }
    catch (e) {
      return res.status(400).json({ message: e })
    }
  })

  app.post('/serverside', async (req: any, res: any) => {
    try {
      // Set the topic to send the notification to
      const { title, body, key, os } = req.body
      // Construct the notification message
      if (key != process.env.API_KEY) return res.status(400).json({ message: 'Wrong key' });
      const message = {
        topic: os,
        notification: {

          title: title,
          body: body,
        },
      };



      // Send the notification to the topic
      admin.messaging().send(message)
        .then((response: any) => {
          console.log('Successfully sent message:', response);
        })
        .catch((error: any) => {
          console.error('Error sending message:', error);
        });
      return res.status(201).json({ message: 'The job is done' });

    }
    catch (e) {
      return res.status(400).json({ message: e })
    }
  })


 
  app.get('/redirect', (req, res) => {
    res.set('Content-Type', 'text/html');
  res.redirect(301, 'https://onelink.to/weupf9');

  });

  // Redirect to the app with the referral code
  app.get('/refer/:referralCode', async (req, res) => {
    try {
        const { referralCode } = req.params;
        const userTo = await User.findOne({ walletAddress: referralCode.toLowerCase() })
        const newPoints = userTo.points + 50;
        await userTo.updateOne({ points: newPoints});
        await userTo.save(); 

        res.set('Content-Type', 'text/html');
  res.redirect(301, 'https://onelink.to/weupf9');
    }
    catch (e) {
      res.send(500)
    }
 
 
  });

  app.post('/faucet', async (req:any, res:any) => {
    try {
      //const{ key }= req.body
        //  if (key != process.env.API_KEY) return res.status(400).json({ message: 'Wrong key' });
    const provider = new ethers.JsonRpcProvider(
      "https://rpc-mumbai.maticvigil.com"
    );
      
    const wallet = new ethers.Wallet(
      process.env.PRIVATE_KEY,
      provider
    );
  
    let contract = new ethers.Contract(
      "0x9ac3d34C1E2718871C23A633F22B04092584A2c3",
      contractAbi,
      wallet
    );
  
    let tx = await contract.getTestTokens(
      req.body.address,
    );
  
    console.log(tx)
      res.status(200).send(tx);
    }
    catch(e)
    {
console.log(e)
      res.status(404).send(e)
    }
  })
  // Listen to Alchemy Notify webhook events
  app.listen(port, host, () => {
    console.log(`Example Alchemy Notify app listening at ${host}:${port}`);
  });


}

main();
