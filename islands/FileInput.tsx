/** @jsx h */
import { h } from "preact";
import { useEffect } from "preact/hooks";
import { tw } from "@twind";
import { convertSlackLogToCsv } from "../utils/slack-zip-to-csv.ts";
import { addBOM, readAsArrayBuffer } from "../utils/data-utils.ts";
import { useDropZone } from "../components/DropZone.tsx";

const downloadFile = (filename: string, data: Blob) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(data);
  link.click();
  URL.revokeObjectURL(link.href);
};

const processFile = async (files: FileList) => {
  const file = files?.[0];
  if (!file) return;
  const buffer = await readAsArrayBuffer(file);
  const csv = await convertSlackLogToCsv(buffer);
  const csvWithBom = addBOM(csv);
  downloadFile("slack-log.csv", csvWithBom);
};

export default function FileInput() {
  const { fileList, dragging, DropZone, FileInputButton } = useDropZone();
  useEffect(() => {
    if (fileList) {
      processFile(fileList);
    }
  }, [fileList]);
  return (
    <div class={tw`flex gap-2 w-full`}>
      <DropZone
        class={tw`p-8 border-2 ${dragging && tw`bg-yellow-100`}`}
      >
        <div class={tw`p-2`}>Drop file here or choose file.</div>
        <FileInputButton
          accept="application/x-zip-compressed"
          class={tw`p-2 border-1 bg-yellow-100 hover:bg-yellow-200`}
        />
      </DropZone>
    </div>
  );
}
