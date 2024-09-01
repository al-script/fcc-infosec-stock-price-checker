"use strict";

module.exports = function (app) {
  require("dotenv").config();
  const bcrypt = require("bcrypt");
  const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

  const mongoose = require("mongoose");
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true })
    .catch((e) => {
      console.log(e.message);
      process.exit(1);
    })
    .then(() => {
      console.log("Connected to Mongo Atlas");
    });

  let stockSchema = new mongoose.Schema({
    symbol: { type: String, require: true },
    likes: { type: Number },
    IP: { type: [String] },
  });

  let Stock = mongoose.model("Stock", stockSchema);

  async function asyncStockDbHandler(stockSymbol, like, userIP, secureIP) {
    let foundStock = await Stock.findOne({ symbol: stockSymbol });
    if (foundStock === null) {
      let newStock = new Stock({
        symbol: stockSymbol,
        likes: 0,
        IP: [""],
      });
      foundStock = await newStock.save();
    }
    if (like === "true") {
      // if want to test a boolean then will have to refactor the like variable as a boolean
      // console.log("Stock was liked, checking for IP in database");
      let wasIPFoundInDb;
      foundStock.IP.forEach((hash) => {
        // could refactor as a for-loop so can break once find an IP
        let foundUserIPInDb = bcrypt.compareSync(userIP, hash);
        if (foundUserIPInDb === true) {
          wasIPFoundInDb = true;
        }
      });
      // console.log("Was IP found in database?", wasIPFoundInDb);
      if (!wasIPFoundInDb) {
        // console.log("IP was not found in database");
        // console.log("Previous likes:", foundStock.likes);
        foundStock.likes++;
        foundStock.IP.push(secureIP);
        // console.log("Saving...");
        return await foundStock.save();
      } else {
        // console.log("IP was found in the database");
        return foundStock;
      }
    } else {
      // console.log("Stock was not liked");
      return foundStock; // could refactor so just have one return foundStock
    }
  }

  async function getStockApiData(apiURL) {
    let response = await fetch(apiURL);
    return response.json();
  }

  async function stockPriceHandler(req, res) {
    try {
      // Define stock symbol data from user request
      // console.log("Initialize stock symbol data");
      let stockSymbol1, stockSymbol2, apiURL;
      if (Array.isArray(req.query.stock)) {
        stockSymbol1 = req.query.stock[0];
        stockSymbol2 = req.query.stock[1];
        apiURL = `https://stock-price-checker.freecodecamp.rocks/api/stock-prices?stock=${stockSymbol1}&stock=${stockSymbol2}`;
      } else {
        stockSymbol1 = req.query.stock;
        apiURL = `https://stock-price-checker.freecodecamp.rocks/api/stock-prices?stock=${stockSymbol1}`;
      }

      // Fetch stock data from API using the previously generated API URL
      // await time(1000);
      // console.log("Fetch stock data from API");
      let apiData = await getStockApiData(apiURL);

      // console.log("+++++, Stock.findOne( {symbol: stockSymbol} )", Stock.findOne( {symbol: stockSymbol1} ))

      // Define price data
      // await time(2000);
      // console.log("Define price data");
      let price1, price2;
      if (stockSymbol2) {
        price1 = apiData.stockData[0].price;
        price2 = apiData.stockData[1].price;
      } else {
        price1 = apiData.stockData.price;
      }

      // console.log(price1);

      // Generate secure version of IP (perhaps refactor so only genereate if user liked the stock...)
      // await time(1000);
      // console.log("Generate secure version of IP if user liked the stock");
      // console.log("Liked?", req.query.like);
      let like = req.query.like; // stored as a string... refactor to return a boolean so that in the async db function can test simply for boolean and not a string
      let userIP = req.socket.remoteAddress;
      let secureIP = bcrypt.hashSync(userIP, 12);

      // handle database operations, and create object containing stock data
      // await time(1000);
      // console.log(
      //   "handle database operations, and create object containing stock data"
      // );
      let stockDataToReturn;
      let stock1 = await asyncStockDbHandler(
        stockSymbol1,
        like,
        userIP,
        secureIP
      );
      if (stockSymbol2) {
        let stock2 = await asyncStockDbHandler(
          stockSymbol2,
          like,
          userIP,
          secureIP
        );
        let rel_likes = stock1.likes - stock2.likes;
        stockDataToReturn = [
          { stock: stockSymbol1, price: +price1, rel_likes: +rel_likes },
          { stock: stockSymbol2, price: +price2, rel_likes: +rel_likes * -1 },
        ];
      } else {
        stockDataToReturn = {
          stock: stockSymbol1,
          price: +price1,
          likes: +stock1.likes,
        };
      }

      // await time(1000);
      // console.log("Return the final object");
      // res.json({ stockData: stockDataToReturn });
      return { "stockData": stockDataToReturn }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      // console.log("Fin");
    }
  }

  app.route("/api/stock-prices").get(async function (req, res) {
    // console.log("Requested stock:", req.query);
    let result = await stockPriceHandler(req, res);
    res.json(result);
  });
};
