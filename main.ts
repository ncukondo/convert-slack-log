import { readZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";
import { Buffer } from "https://deno.land/std@0.149.0/io/buffer.ts";
import { join, parse } from "https://deno.land/std@0.148.0/path/mod.ts";

type RawEntry = {
  type: string;
  text: string;
  ts?: string;
  username?: string;
  user_profile?:{
    name?: string;
    real_name?:string;
    display_name?:string;
  }
}

const convertJsonToMessagObj = (name: string, data: RawEntry) => {
  const unixtime =Number.parseFloat(data?.ts ?? "") * 1000 
  const timestamp =  unixtime ? new Date(unixtime).toISOString() : "";
  const channel = name.split("/")[0] ?? "";
  const text = data.text ?? "";
  const real_name = data.user_profile?.real_name ?? "";
  const display_name = data.user_profile?.display_name ?? "";
  const user = data.username ?? data.user_profile?.name ?? "";
  const result = { timestamp, channel, text, user,real_name,display_name };
  return result;
};

const readJsonsInZip = async (zipFile: string) => {
  const zip = await readZip(zipFile);
  return await Promise.all([...zip].flatMap(async (z) => {
    const name = z.name;
    if (!name.endsWith(".json")) return [];
    const data = JSON.parse(await zip.file(name).async("string"));
    return { name, data };
  })) as { name: string; data: RawEntry }[];
};

const extractMessagesFromJson = (files: { name: string; data: RawEntry }[]) => {
  return files.flatMap(({ name, data }) => {
    if (!Array.isArray(data)) return [];
    return data.flatMap((content) => {
      if (content?.type !== "message") return [];
      return convertJsonToMessagObj(name,content);
    });
  });
};

const extractMessagesFromZip = async (zipFile: string) => {
  const files = await readJsonsInZip(zipFile);
  return extractMessagesFromJson(files);
};

const objectsToTable = (objList: Record<string, string>[]) => {
  const keys = objList.map((obj) => Object.keys(obj)).reduce(
    (stack, curr) => [...new Set([...stack, ...curr])],
    [],
  );
  return [
    keys,
    ...objList.map((obj) => {
      return keys.map((key) => key in obj ? obj[key] : "");
    }),
  ];
};

const toCSV = (data: string[][]) => {
  const text = data.map((row) =>
    row.map((cell) => {
      const cellText = cell?.replaceAll('"', '""') ?? "";
      return cellText ? `"${cellText}"` : "";
    }).join(",")
  ).join("\n");
  return text;
};

const saveCSV = async (data: string, filename: string) => {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, data], { type: "text/csv" });
  const buffer = await blob.arrayBuffer();
  const unit8arr = new Buffer(buffer).bytes();
  await Deno.writeFile(filename, unit8arr);
};

const convertSlackLogToCsv = async (filename: string) => {
  const { dir, name } = parse(filename);
  const messages = await extractMessagesFromZip(filename);
  const table = objectsToTable(messages);
  const csv = toCSV(table);
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
  const output = await convertSlackLogToCsv(filename);
  console.log(`output as ${output}`);
};

await main();
