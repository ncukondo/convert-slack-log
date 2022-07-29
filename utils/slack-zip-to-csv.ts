import { JSZip } from "jszip";

type MessageEntry = {
  type: string;
  text: string;
  ts?: string;
  username?: string;
  user_profile?: {
    name?: string;
    real_name?: string;
    display_name?: string;
  };
};

const convertJsonToMessagObj = (name: string, data: MessageEntry) => {
  const unixtime = Number.parseFloat(data?.ts ?? "") * 1000;
  const timestamp = unixtime ? new Date(unixtime).toISOString() : "";
  const channel = name.split("/")[0] ?? "";
  const text = data.text ?? "";
  const real_name = data.user_profile?.real_name ?? "";
  const display_name = data.user_profile?.display_name ?? "";
  const user = data.username ?? data.user_profile?.name ?? "";
  const result = { timestamp, channel, text, user, real_name, display_name };
  return result;
};

const readJsonsInZip = async (zipFile: ArrayBuffer) => {
  const zip = await new JSZip().loadAsync(zipFile);
  const names = [...zip]
    .map((z) => z.name)
    .filter((name) => name.endsWith(".json"))
    .sort();
  const jsonTexts = await Promise.all(names.map(async (name) => {
    return { name, text: (await zip.file(name).async("string")) };
  }));
  return jsonTexts.map(({ name, text }) => ({ name, data: JSON.parse(text) }));
};

const extractMessagesFromJson = (
  files: { name: string; data: MessageEntry }[],
) => {
  return files.flatMap(({ name, data }) => {
    if (!Array.isArray(data)) return [];
    return data.flatMap((content) => {
      if (content?.type !== "message") return [];
      return convertJsonToMessagObj(name, content);
    });
  });
};

const extractMessagesFromZip = async (zipFile: ArrayBuffer) => {
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

const convertSlackLogToCsv = async (zipFile: ArrayBuffer) => {
  const messages = await extractMessagesFromZip(zipFile);
  const table = objectsToTable(messages);
  return toCSV(table);
  //return await (addBOM(csv));
};

export { convertSlackLogToCsv, readJsonsInZip };
