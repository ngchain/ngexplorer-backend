const worker = require("worker_threads");

if (worker.isMainThread) {
  const syncMan = new worker.Worker("./syncMan.js");
  syncMan.on("message", (msg) => {
    console.log("[SYNC]" + msg);
  });
  syncMan.on("error", (err) => {
    console.log("[SYNC]" + err);
  });
  syncMan.on("exit", (code) => {
    if (code !== 0) throw Error(`Worker stopped with exit code ${code}`);
  });

  const server = new worker.Worker("./server.js");
  server.on("message", (msg) => {
    console.log("[SERVER]" + msg);
  });
  server.on("error", (err) => {
    console.log("[SERVER]" + err);
  });
  server.on("exit", (code) => {
    if (code !== 0) throw Error(`Worker stopped with exit code ${code}`);
    exit(code)
  });
}
