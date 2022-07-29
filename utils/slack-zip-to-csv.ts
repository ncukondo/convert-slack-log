import { JSZip } from "jszip";

type MessageEntry = UserMessageEntry | OtherMessageEntry;

type UserMessageEntry = {
  type: "message";
  text: string;
  ts: string;
  user: string;
  user_profile?: {
    name?: string;
    real_name?: string;
    display_name?: string;
  };
};

type OtherMessageEntry = {
  type: "message";
  sub_type: "channel_join" | "bot_message" | "bot_add";
  text: string;
  ts: string;
  user: string;
  username?: string;
};

type UserEntry = {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  real_name: string;
  tz: string;
  profile: {
    real_name: string;
    display_name: string;
    first_name: string;
    last_name: string;
  };
};

const convertOtherMessage = (
  { message: { username, sub_type } }: {
    message: OtherMessageEntry;
  },
) => {
  const user_name = username ?? "";
  return { user_name, sub_type };
};

const convertUserMessage = (
  { message, user }: {
    message: UserMessageEntry;
    user?: UserEntry;
  },
) => {
  const user_id = message.user ?? "";
  const real_name = message.user_profile?.real_name ?? "";
  const display_name = message.user_profile?.display_name ?? "";
  const user_name = user?.name ?? "";
  const result = {
    user_name,
    real_name,
    display_name,
    user_id,
  };
  return result;
};

const convertMessage = (
  { message, channel, users }: {
    message: MessageEntry;
    channel: string;
    users?: Record<string, UserEntry>;
  },
) => {
  const user_id = message.user ?? "";
  const unixtime = Number.parseFloat(message?.ts ?? "") * 1000;
  const timestamp = unixtime ? new Date(unixtime).toISOString() : "";
  const text = message.text ?? "";
  const result = { channel, timestamp, text, user_id };
  if ("sub_type" in message) {
    return { ...result, ...convertOtherMessage({ message }) };
  } else {
    const user = users?.[user_id];
    return { ...result, ...convertUserMessage({ message, user }) };
  }
};

const readJsonsInZip = async (zipFile: ArrayBuffer) => {
  const zip = await new JSZip().loadAsync(zipFile);
  const names = [...zip].map((z) => z.name).filter((name) =>
    name.endsWith(".json")
  );
  const texts = await Promise.all(names.map(async (name) => {
    return { name, text: (await zip.file(name).async("string")) };
  }));
  return texts.map(({ name, text }) => ({ name, data: JSON.parse(text) }));
};

const getUserInfo = (
  files: { name: string; data: unknown }[],
) => {
  const userEntries = (files
    .find(({ name }) => name === "users.json")
    ?.data as UserEntry[])
    ?.map((entry) => [entry.id, entry] as [string, UserEntry]);
  return userEntries && Object.fromEntries(userEntries);
};

const extractMessagesFromFiles = (
  files: { name: string; data: unknown }[],
) => {
  const users = getUserInfo(files);

  const messages = files
    .filter(({ data }) => Array.isArray(data))
    .map(({ name, data: entries }) => {
      const channel = name.split("/")[0] ?? "";
      return (entries as UserMessageEntry[])
        .filter((data) => data?.type === "message")
        .map((message) => ({ channel, message, users }));
    })
    .flat();
  return messages.map(convertMessage);
};

const extractMessagesFromZip = async (zipFile: ArrayBuffer) => {
  const files = await readJsonsInZip(zipFile);
  const sorted = files.sort(({ name: a }, { name: b }) =>
    (a > b && 1) || (a < b && -1) || 0
  );
  return extractMessagesFromFiles(sorted);
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
};

export { convertSlackLogToCsv, readJsonsInZip };
