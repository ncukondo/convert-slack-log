const addBOM = (data: string) => {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, data], { type: "text/csv" });
  return blob;
};

const readAsArrayBuffer = (file: File) => {
  const reader = new FileReader();

  return new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject("Unknown error occurred during reading the file");
    };

    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };

    reader.readAsArrayBuffer(file);
  });
};

export { addBOM, readAsArrayBuffer };
