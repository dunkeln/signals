import { execFileSync } from "node:child_process";

const alias = "signals-ws.vercel.app";
const deployment = JSON.parse(
  execFileSync("npx", ["vercel", "deploy", "--prod", "--yes", "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }),
);

const url = deployment.url;

if (!url) {
  throw new Error("Vercel deploy did not return a deployment URL.");
}

execFileSync("npx", ["vercel", "alias", "set", url, alias], {
  stdio: "inherit",
});

console.log(`Deployed https://${alias}`);
