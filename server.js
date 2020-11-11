const Redis = require("ioredis");
const express = require("express");
const config = require("./config")
const cors = require("cors");

const redis = new Redis(config.redis);

const app = express();
app.use(cors());

app.get("/", async (req, res) => res.send("Hello NGIN!"));

app.get("/search/:hashOrHeight", async (req, res) => {
  const stats = await redis.hget("ng:explorer:latest", "stats");
  res.send(stats);
});

app.get("/dashboard", async (req, res) => {
  const stats = await redis.hget("ng:explorer:latest", "stats");
  res.send(stats);
});

app.get("/blocks", async (req, res) => {
  const blocks = [];
  const latestHeight = await redis.hget("ng:explorer:latest", "height");
  for (let h = latestHeight; h > latestHeight - 50; h--) {
    const blockHash = await redis.hget("ng:explorer:block:height", h);
    const jsonBlock = await redis.hget("ng:explorer:block:hash", blockHash);

    const block = JSON.parse(jsonBlock)
    if (block != null) {
      blocks.push(JSON.parse(jsonBlock));
    }
  }

  res.send(blocks);
});

app.get("/block/:hashOrHeight", async (req, res) => {
  const hashOrHeight = req.params.hashOrHeight;

  if (hashOrHeight == null || hashOrHeight.length === 0) {
    res.sendStatus(404);
    return;
  }

  let jsonBlock;
  if (hashOrHeight.length === 64) {
    jsonBlock = await redis.hget("ng:explorer:block:hash", hashOrHeight);
  } else {
    const blockHash = await redis.hget(
      "ng:explorer:block:height",
      hashOrHeight
    );
    jsonBlock = await redis.hget("ng:explorer:block:hash", blockHash);
  }
  
  res.send(jsonBlock);
});

app.get("/tx/:txHash/block", async (req, res) => {
  const txHash = req.params.txHash;

  if (txHash == null || txHash.length !== 64) {
    res.sendStatus(404);
    return;
  }

  const blockHash = await redis.hget("ng:explorer:tx:block", txHash);
  if (blockHash == null || blockHash.length === 0) {
    res.sendStatus(404);
    return;
  }

  res.send(blockHash);
});

app.get("/tx/:txHash", async (req, res) => {
  const txHash = req.params.txHash;

  if (txHash == null || txHash.length !== 64) {
    res.sendStatus(404);
    return;
  }

  const tx = await redis.hget("ng:explorer:tx", txHash);

  res.send(tx);
});

app.get("/account/:num", async (req, res) => {
  const num = req.params.num;

  if (num == null) {
    res.sendStatus(404);
    return;
  }

  const account = await redis.hget("ng:explorer:account", num);

  res.send(account);
});

app.get("/address/:addr", async (req, res) => {
  const addr = req.params.addr;

  if (addr == null) {
    res.sendStatus(404);
    return;
  }

  const balance = await redis.hget("ng:explorer:address", addr);
  if (balance == null) {
    res.sendStatus(404);
    return;
  }

  res.send(balance);
});

async function main() {
  app.listen(config.port, () =>
    console.log(`Explorer listening at http://127.0.0.1:${config.port}`)
  );
}
main()