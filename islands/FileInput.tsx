/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";
import {convertSlackLogToCsv} from "../utils/slack-zip-to-csv.ts"
import { addBOM} from "../utils/data-utils.ts"

const readAsArrayBuffer = (file:File) => {
  const reader = new FileReader();

  return new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject('Unknown error occurred during reading the file');
    };

    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };

    reader.readAsArrayBuffer(file);
  });
};

const useFileInputEvent = () => {
  const [fileBuffer,setfileBuffer] = useState<ArrayBuffer|null>(null);
  const onFileInput = (e: h.JSX.TargetedEvent<HTMLInputElement,Event>) => {
    const file = e.currentTarget?.files?.[0]; 
    if(file) {
      readAsArrayBuffer(file).then(buffer=>setfileBuffer(buffer));
    }
  };
  return {fileBuffer,onFileInput};
}

const downloadFile = (filename:string,data:Blob) =>{
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(data);
  link.click();
  URL.revokeObjectURL(link.href);
}

const onFile = async (file:File) => {
  const buffer =  await readAsArrayBuffer(file);
  const csv = await convertSlackLogToCsv(buffer);
  downloadFile("slack-log.csv",addBOM(csv))
  console.log(csv);

}

const onFileInput = (e: h.JSX.TargetedEvent<HTMLInputElement,Event>) => {
  const file = e.currentTarget?.files?.[0]; 
  if(file) onFile(file);
};

export default function FileInput() {
  return (
    <div class={tw`flex gap-2 w-full`}>
      <input type="file" onInput={onFileInput}/>
    </div>
  );
}
