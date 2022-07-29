/** @jsx h */
import { h } from "preact";
import { useEffect, useRef } from "preact/hooks";
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

const onFile = async (files: FileList | null) => {
  const file = files?.[0];
  if (!file) return;
  const buffer = await readAsArrayBuffer(file);
  const csv = await convertSlackLogToCsv(buffer);
  const csvWithBom = addBOM(csv);
  downloadFile("slack-log.csv", csvWithBom);
};

export default function FileInput() {
  const { fileList, dragging, DropZone } = useDropZone();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (fileList && input?.current) {
      input.current.files = fileList;
      onFile(fileList);
    }
  }, [fileList, input]);
  return (
    <div className={tw`flex gap-2 w-full`}>
      <DropZone
        className={tw`p-8 border-2 ${dragging && tw`bg-yellow-100`}`}
      >
        <div class={tw`p-2`}>Drop file here or choose file.</div>
        <input
          type="file"
          onInput={(e) => onFile(e.currentTarget?.files)}
          ref={input}
        />
      </DropZone>
    </div>
  );
}
