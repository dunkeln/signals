import { execFileSync } from "node:child_process";

const alias = "signals-ws.vercel.app";
const deployment = JSON.parse(
  execFileSync("npx", ["vercel", "deploy", "--prod", "--yes", "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }),
);

const url =
  deployment.url ??
  deployment.deployment?.url ??
  deployment.aliases?.[0] ??
  deployment.alias;

if (!url) {
  throw new Error("Vercel deploy did not return a deployment URL.");
}

execFileSync("npx", ["vercel", "alias", "set", targetUrl(url), alias], {
  stdio: "inherit",
});

console.log(`Deployed https://${alias}`);

function targetUrl(value) {
  return value.startsWith("http") ? value : `https://${value}`;
}
