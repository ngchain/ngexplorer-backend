const Redis = require("ioredis");
const express = require("express");
const port = require("./config").port;
const cors = require("cors");

const redis = new Redis();

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
    blocks.push(JSON.parse(jsonBlock));
  }

  res.send(blocks);
});

app.get("/block/:hashOrHeight", async (req, res) => {
  const hashOrHeight = req.params.hashOrHeight;

  if (hashOrHeight == null || hashOrHeight.length === 0) {
    res.sendStatus(404);
    return;
  }

  try {
    res.send(JSON.stringify(await getBlockByHashOrHeight(hashOrHeight)));
  } catch (e) {
    res.sendStatus(404);
  }
});

app.get("/address/:address", async (req, res) => {
  const stats = await redis.hget("ng:explorer:latest", "stats");
  res.send(stats);
});

app.get("/account/:account", async (req, res) => {
  const stats = await redis.hget("ng:explorer:latest", "stats");
  res.send(stats);
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

async function getBlockByHashOrHeight(hashOrHeight) {
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

  const block = JSON.parse(jsonBlock);
  await Promise.all(
    block.txs.map(async (txHash, i) => {
      const tx = await getTxByHash(txHash);
      block.txs[i] = tx;
    })
  );

  return block;
}

async function getTxByHash(txHash) {
  const jsonTx = await redis.hget("ng:explorer:tx:hash", txHash);
  if (jsonTx == null || jsonTx.length === 0) {
    throw Error();
  }

  return JSON.parse(jsonTx);
}


async function main() {
  app.listen(port, () =>
    console.log(`Explorer listening at http://127.0.0.1:${port}`)
  );
}
main()