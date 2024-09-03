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

  async function handleStockPriceRequest(req) {
    try {
      validateRequest(req);
      const sanitizedRequest = await sanitizeRequest(req);
      const processedRequest = await processRequest(sanitizedRequest, req);
      return processedRequest;
    } catch (error) {
      throw new Error(error);
    }

    // Supporting functions
    async function validateRequest(req) {
      // Example queries:
      // { stock: 'GOOG' }
      // { stock: 'GOOG', like: 'true' }
      // { stock: [ 'GOOG', 'MSFT' ] }
      // { stock: [ 'GOOG', 'MSFT' ], like: 'true' }

      // Handle validation
      // *** ASSUMING VALIDATION FOR TEST ***
      let validated;
      try {
        validated = true;
      } catch (e) {
        validated = false;
      }

      if (!validated) {
        throw new Error("Validation failed");
      }
    }
    async function sanitizeRequest(req) {
      // Handle sanization
      // *** ASSUMING SANITIZATION FOR TEST ***
      let sanitized, sanitizedRequest;

      try {
        sanitized = true;
        sanitizedRequest = {
          stock: req.query.stock,
          like: req.query.like ? true : false,
        };
      } catch (e) {
        sanitized = false;
      }

      if (!sanitized) {
        throw new Error("Sanitization failed");
      } else {
        return sanitizedRequest;
      }
    }
    async function processRequest(sanitizedRequest, req) {
      // Example return:
      // {"stockData":{"stock":"GOOG","price":786.90,"likes":1}}
      // {"stockData":[{"stock":"MSFT","price":62.30,"rel_likes":-1},{"stock":"GOOG","price":786.90,"rel_likes":1}]}

      // Handle request
      let processedRequest;
      try {
        if (typeof sanitizedRequest.stock == "string") {
          processedRequest = await processAndReturnStockData(sanitizedRequest);
        } else {
          const stockDataOne = await processAndReturnStockData({
            stock: sanitizedRequest.stock[0],
            like: sanitizedRequest.like,
          });
          const stockDataTwo = await processAndReturnStockData({
            stock: sanitizedRequest.stock[1],
            like: sanitizedRequest.like,
          });
          processedRequest = await joinMultipleStocks(
            stockDataOne,
            stockDataTwo
          );
        }
      } catch (e) {
        throw new Error("Processing failed");
      }
      return processedRequest;

      // Supporting functions
      async function processAndReturnStockData(sanitizedRequest) {
        const stockSymbol = sanitizedRequest.stock;
        const like = sanitizedRequest.like || false;
        const stockPrice = await getStockPrice(stockSymbol);
        const stockDatabaseData = await handleStockDatabaseOperations(
          stockSymbol,
          like,
          stockPrice,
          req
        );

        return { stockData: stockDatabaseData };
      }
      async function getStockPrice(stockSymbol) {
        const stockDataApiUrl = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`;
        const response = await fetch(stockDataApiUrl);
        const stockData = await response.json();
        const stockPrice = stockData.latestPrice;
        return stockPrice;
      }
      async function handleStockDatabaseOperations(
        stockSymbol,
        like,
        stockPrice,
        req
      ) {
        let stockDatabaseEntry = await Stock.findOne({ symbol: stockSymbol });
        if (stockDatabaseEntry === null) {
          const newStockDatabaseEntry = new Stock({
            symbol: stockSymbol,
            likes: 0,
            IP: [""],
          });
          stockDatabaseEntry = await newStockDatabaseEntry.save();
        }

        if (like) {
          await likeStock(req);
        }

        const stockObject = {
          stock: stockSymbol,
          price: stockPrice,
          likes: stockDatabaseEntry.likes,
        };

        return stockObject;

        async function likeStock(req) {
          const likerIp = req.socket.remoteAddress;

          const alreadyLikedByIp = stockDatabaseEntry.IP.some((hash) => {
            if (bcrypt.compareSync(likerIp, hash)) {
              return true;
            }
          });

          if (!alreadyLikedByIp) {
            const hashedLikerIp = bcrypt.hashSync(likerIp, 12);
            stockDatabaseEntry.IP.push(hashedLikerIp);
            stockDatabaseEntry.likes++;
            return await stockDatabaseEntry.save();
          }
        }
      }

      async function joinMultipleStocks(stockDataOne, stockDataTwo) {
        const joinedStockData = {
          stockData: [
            {
              stock: stockDataOne.stockData.stock,
              price: stockDataOne.stockData.price,
              rel_likes:
                stockDataOne.stockData.likes - stockDataTwo.stockData.likes,
            },
            {
              stock: stockDataTwo.stockData.stock,
              price: stockDataTwo.stockData.price,
              rel_likes:
                stockDataTwo.stockData.likes - stockDataOne.stockData.likes,
            },
          ],
        };
        return joinedStockData;
      }
    }
  }

  app.get("/api/stock-prices", async (req, res) => {
    try {
      const result = await handleStockPriceRequest(req);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Request failed" });
    }
  });
};
