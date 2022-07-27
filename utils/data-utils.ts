const addBOM = (data: string) => {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, data], { type: "text/csv" });
  return blob;
};

export { addBOM };
