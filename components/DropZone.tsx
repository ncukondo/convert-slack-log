/** @jsx h */
import { ComponentChildren, h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

const useDropZone = () => {
  const [fileList, setFileList] = useState<FileList | null>(null);
  const [dragging, setDragging] = useState(false);

  const DropZone = (
    { className, children }: {
      className?: string;
      children?: ComponentChildren;
    },
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
      >
        <div className={className}>
          {children}
        </div>
      </div>
    );
  };
  return { fileList, dragging, DropZone };
};

export { useDropZone };
