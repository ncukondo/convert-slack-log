/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import FileInput from "../islands/FileInput.tsx";

export default function Home() {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      
      <p class={tw`my-6`}>
        Input zip file exported from slack.
      </p>
      <FileInput />
    </div>
  );
}
