import { readZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";
import {Buffer} from "https://deno.land/std@0.149.0/io/buffer.ts";
import { parse,join } from "https://deno.land/std@0.148.0/path/mod.ts";

const readJsonsInZip = async (zipFile: string) => {
  const zip = await readZip(zipFile);
  return await Promise.all([...zip].flatMap(async (z) => {
    const name = z.name;
    if (!name.endsWith(".json")) return [];
    const data = JSON.parse(await zip.file(name).async("string"));
    return { name, data };
  })) as { name: string; data: JSON }[];
};

const extractMessagesFromJson = (files: { name: string; data: JSON }[]) => {
  return files.flatMap(({ name, data }) => {
    if (!Array.isArray(data)) return [];
    return data.flatMap((content) => {
      if (content?.type !== "message") return [];
      const timestamp = new Date(Number.parseFloat(content?.ts) * 1000).toISOString();
      const channel = name.split("/")[0];
      const text:string = content.text;
      const user:string = content.username ?? content.user_profile?.name;
      return { timestamp, channel, text, user };
    });
  });
};

const extractMessagesFromZip = async (zipFile:string) => {
  const files = await readJsonsInZip(zipFile)
  return extractMessagesFromJson(files);
}

const objectsToTable = (objList:Record<string,string>[]) => {
  const keys = objList.map(obj=>Object.keys(obj)).reduce((stack,curr)=>[...new Set([...stack,...curr])],[]);
  return [keys,...objList.map((obj=>{
    return keys.map((key)=>key in obj ? obj[key] : "");
  }))]
}

const toCSV = (data:string[][]) => {
  const text = data.map(row=>row.map(cell=>{
    const cellText = cell?.replaceAll('"','""') ?? "";
    return cellText ? `"${cellText}"` : ""
  }).join(",")).join("\n");
  return text;
}

const saveCSV = async (data:string,filename:string ) => {
  const bom  = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, data], {type: 'text/csv'});
  const buffer = await blob.arrayBuffer();
  const unit8arr = new Buffer(buffer).bytes();
  await Deno.writeFile(filename, unit8arr);
}

const convertSlackLogToCsv = async(filename:string) => {
  const {dir,name} = parse(filename);
  const messages = await extractMessagesFromZip(filename);
  const table = objectsToTable(messages);
  const csv = toCSV(table);
  await(saveCSV(csv,join(dir,name+".csv")));
  return join(dir,name+".csv")
}

const main = async () => {
  const filename = Deno.args[0];
  if(!filename) {
    console.log("input zip filename exported from slack");
    return;
  }
  console.log(`start converting ${filename}`)
  const output = await convertSlackLogToCsv(filename);
  console.log(`output as ${output}`);
}

await main();
