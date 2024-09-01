const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  let likesFirst, likesSecond;

  // Viewing one stock: GET request to /api/stock-prices/
  test("Viewing one stock: GET request to /api/stock-prices/", function (done) {
    // had to pass in and then call done... perhaps need to do this on my other projects as well
    this.timeout(10000);
    chai
      .request(server)
      .get("/api/stock-prices?stock=GOOG")
      .end(function (err, res) {
        // setTimeout(()=>{console.log("waiting...")}, 4000);
        // console.log(res.body);
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.isObject(res.body, "response should be an object");
        assert.property(
          res.body,
          "stockData",
          "response should contain a stockData object"
        );
        assert.property(
          res.body.stockData,
          "stock",
          "stockData object should contain stock property"
        );
        assert.property(
          res.body.stockData,
          "price",
          "stockData object should contain price property"
        );
        assert.property(
          res.body.stockData,
          "likes",
          "stockData object should contain likes property"
        );
        done();
        // setTimeout(()=>{console.log("waiting...")}, 4000);
      })
      .timeout(5000);
  });

  // Viewing one stock and liking it: GET request to /api/stock-prices/
  test("Viewing one stock and liking it: GET request to /api/stock-prices/", function (done) {
    this.timeout(10000);
    chai
      .request(server)
      .get("/api/stock-prices?stock=GOOG&like=true")
      .end(function (err, res) {
        // setTimeout(()=>{console.log("waiting...")}, 4000);
        // console.log(res.body);
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.isObject(res.body, "response should be an object");
        assert.property(
          res.body,
          "stockData",
          "response should contain a stockData object"
        );
        assert.property(
          res.body.stockData,
          "stock",
          "stockData object should contain stock property"
        );
        assert.property(
          res.body.stockData,
          "price",
          "stockData object should contain price property"
        );
        assert.property(
          res.body.stockData,
          "likes",
          "stockData object should contain likes property"
        );
        likesFirst = res.body.likes;
        done();
        // assert.equal(likesAfter, likesBefore + 1, "likes should be incremented by one") //but this may break if run the test from the same IP... so perhaps don't need this test
        // setTimeout(()=>{console.log("waiting...")}, 4000);
      })
      .timeout(5000);
  });

  // Viewing the same stock and liking it again: GET request to /api/stock-prices/
  test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", function (done) {
    this.timeout(10000);
    chai
      .request(server)
      .get("/api/stock-prices?stock=GOOG&like=true")
      .end(function (err, res) {
        // console.log(res.body)
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.isObject(res.body, "response should be an object");
        assert.property(
          res.body,
          "stockData",
          "response should contain a stockData object"
        );
        assert.property(
          res.body.stockData,
          "stock",
          "stockData object should contain stock property"
        );
        assert.property(
          res.body.stockData,
          "price",
          "stockData object should contain price property"
        );
        assert.property(
          res.body.stockData,
          "likes",
          "stockData object should contain likes property"
        );
        likesSecond = res.body.likes;
        assert.equal(
          likesFirst,
          likesSecond,
          "likes should not be incremented if same stock is liked"
        );
        done();
      });
  });

  // Viewing two stocks: GET request to /api/stock-prices/
  test("Viewing two stocks", function (done) {
    this.timeout(10000);
    chai
      .request(server)
      .get("/api/stock-prices?stock=GOOG&stock=MSFT")
      .end(function (err, res) {
        // console.log(res.body)
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.isObject(res.body, "response should be an object");
        assert.property(
          res.body,
          "stockData",
          "response should contain a stockData array"
        );
        assert.equal(
          res.body.stockData.length,
          2,
          "stockData array should contain two objects"
        );
        assert.property(
          res.body.stockData[0],
          "stock",
          "the first object in stockData array should contain stock property"
        );
        assert.property(
          res.body.stockData[0],
          "price",
          "the first object in stockData should contain price property"
        );
        assert.property(
          res.body.stockData[0],
          "rel_likes",
          "the first object in stockData should contain rel_likes property"
        );
        assert.property(
          res.body.stockData[1],
          "stock",
          "the second object in stockData array should contain stock property"
        );
        assert.property(
          res.body.stockData[1],
          "price",
          "the second object in stockData should contain price property"
        );
        assert.property(
          res.body.stockData[1],
          "rel_likes",
          "the second object in stockData should contain rel_likes property"
        );
        done();
      });
  });

  // Viewing two stocks and liking them: GET request to /api/stock-prices/
  test("Viewing two stocks and liking them", function (done) {
    this.timeout(10000);
    chai
      .request(server)
      .get("/api/stock-prices?stock=GOOG&stock=MSFT&like=true")
      .end(function (err, res) {
        // console.log(res.body)
        assert.equal(res.status, 200);
        assert.equal(res.type, "application/json");
        assert.isObject(res.body, "response should be an object");
        assert.property(
          res.body,
          "stockData",
          "response should contain a stockData array"
        );
        assert.equal(
          res.body.stockData.length,
          2,
          "stockData array should contain two objects"
        );
        assert.property(
          res.body.stockData[0],
          "stock",
          "the first object in stockData array should contain stock property"
        );
        assert.property(
          res.body.stockData[0],
          "price",
          "the first object in stockData should contain price property"
        );
        assert.property(
          res.body.stockData[0],
          "rel_likes",
          "the first object in stockData should contain rel_likes property"
        );
        assert.property(
          res.body.stockData[1],
          "stock",
          "the second object in stockData array should contain stock property"
        );
        assert.property(
          res.body.stockData[1],
          "price",
          "the second object in stockData should contain price property"
        );
        assert.property(
          res.body.stockData[1],
          "rel_likes",
          "the second object in stockData should contain rel_likes property"
        );
        done();
      });
  });
});
