/** @jsx h */
import { ComponentProps, h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

type DropZoneProps = Omit<
  ComponentProps<"div">,
  "onDragOver" | "onDrop" | "onDragLeave"
>;

type DropButtonProps = Omit<ComponentProps<"button">, "onClick"> & {
  text?: string;
  multiple?: boolean;
  accept?: string;
};

const useFileInputButton = () => {
  const [fileList, setFileList] = useState<FileList | null>(null);

  const FileInputButton = (props: DropButtonProps) => {
    const { multiple, accept, text, ...rest } = {
      text: "Choose File",
      ...props,
    };
    const inputRef = useRef<HTMLInputElement | null>(null);
    const handleInput = useCallback(
      (e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
        const files = e.currentTarget?.files;
        console.log(`file input ${files}`);
        if (files) setFileList(files);
      },
      [],
    );
    const handleClick = useCallback(() => {
      inputRef?.current?.click();
    }, [inputRef, inputRef?.current]);
    useEffect(() => {
      if (inputRef?.current && fileList) {
        inputRef.current.files = fileList;
      }
    }, [fileList]);
    return (
      <div>
        <input
          type="file"
          ref={inputRef}
          {...{ multiple, accept }}
          onInput={handleInput}
          style={{ display: "none" }}
        />
        <button onClick={handleClick} {...rest}>{text}</button>
      </div>
    );
  };
  return { fileList, setFileList, FileInputButton };
};

const useDropZone = () => {
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [dragging, setDragging] = useState(false);

  const DropZone = (
    props: DropZoneProps,
  ) => {
    const handleDragOver = useCallback(
      (e: h.JSX.TargetedDragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        if (!dragging) setDragging(true);
      },
      [],
    );
    const handleDragLeave = useCallback(
      (e: h.JSX.TargetedDragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        if (dragging) setDragging(false);
      },
      [],
    );
    const handleDrop = useCallback(
      (e: h.JSX.TargetedDragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setDragging(false);
        const files = e.dataTransfer?.files;
        if (files) setFileList(files);
      },
      [],
    );
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      >
        {props.children}
      </div>
    );
  };
  return { fileList, dragging, DropZone };
};

const useDropZoneWithButton = () => {
  const { fileList, setFileList, FileInputButton } = useFileInputButton();
  const opts = useDropZone();

  useEffect(() => {
    setFileList(opts.fileList);
  }, [opts.fileList]);
  return { ...opts, fileList, FileInputButton };
};

export { useDropZone, useDropZoneWithButton };
