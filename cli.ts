import { Buffer } from "buffer";
import { join, parse } from "path";
import { convertSlackLogToCsv } from "./utils/slack-zip-to-csv.ts";

const saveCSV = async (data: string, filename: string) => {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, data], { type: "text/csv" });
  const buffer = await blob.arrayBuffer();
  const unit8arr = new Buffer(buffer).bytes();
  await Deno.writeFile(filename, unit8arr);
};

const convertSlackLogFilenameToCsv = async (filename: string) => {
  const content: Uint8Array = await Deno.readFile(filename);
  const { dir, name } = parse(filename);
  const csv = await convertSlackLogToCsv(content);
  await (saveCSV(csv, join(dir, name + ".csv")));
  return join(dir, name + ".csv");
};

const main = async () => {
  const filename = Deno.args[0];
  if (!filename) {
    console.log("input zip filename exported from slack");
    return;
  }
  console.log(`start converting ${filename}`);
  const output = await convertSlackLogFilenameToCsv(filename);
  console.log(`output as ${output}`);
};

await main();
