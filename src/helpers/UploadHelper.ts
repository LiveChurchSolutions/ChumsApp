import Papa from "papaparse";
import AdmZip from "adm-zip";
import FileSaver from "file-saver";

export class UploadHelper {

  static zipFiles(files: { name: string, contents: string | Buffer }[], zipFileName: string) {
    let zip = new AdmZip();
    files.forEach((f) => {
      if (typeof f.contents === "string") zip.addFile(f.name, Buffer.alloc(f.contents.length, f.contents));
      else zip.addFile(f.name, f.contents as Buffer);
    });
    let buffer = zip.toBuffer();
    let blob = new Blob([buffer], { type: "applicatoin/zip" });
    FileSaver.saveAs(blob, zipFileName);
  }

  static downloadImageBytes(files: { name: string, contents: string | Buffer }[], name: string, url: string) {
    return new Promise<void>((resolve, reject) => {
      try {
        let oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = "blob";
        oReq.onload = async () => {
          const blob = new Blob([oReq.response], { type: "image/png" });
          let buffer = this.toBuffer(await blob.arrayBuffer());
          files.push({ name: name, contents: buffer });
          resolve();
        };
        oReq.send();
      } catch {
        reject(new DOMException("Could not download image."));
      }
    });
  }

  static toBuffer(ab: ArrayBuffer) {
    let buffer = new Buffer(ab.byteLength);
    let view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; ++i) buffer[i] = view[i];
    return buffer;
  }

  static async getCsv(files: FileList, fileName: string) {
    let file = this.getFile(files, fileName);
    if (file !== null) return await this.readCsv(file);
    else return null;
  }

  static readCsvString(csv: string) {
    let result = [];
    let data = Papa.parse(csv, { header: true });
    for (let i = 0; i < data.data.length; i++) {
      let r: any = this.getStrippedRecord(data.data[i]);
      result.push(r);
    }
    return result;
  }

  static readCsv(file: File) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        let result = [];
        let csv = reader.result.toString();
        let data = Papa.parse(csv, { header: true });

        for (let i = 0; i < data.data.length; i++) {
          let r: any = this.getStrippedRecord(data.data[i]);
          result.push(r);
        }
        resolve(result);
      };
      reader.onerror = () => {
        reader.abort();
        reject(new DOMException("Problem parsing input file."));
      };
      reader.readAsText(file);
    });
  }

  static getFile(files: FileList, fileName: string) {
    for (let i = 0; i < files.length; i++) if (files[i].name === fileName) return files[i];
    return null;
  }

  static readBinary(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { resolve(reader.result.toString()); };
      reader.onerror = () => { reject(new DOMException("Error reading image")) }
      reader.readAsArrayBuffer(file);
    });
  }

  static getZippedFile(files: AdmZip.IZipEntry[], name: string) {
    for (let i = 0; i < files.length; i++) if (files[i].entryName === name) return files[i];
    return null;
  }

  static readZippedCsv(files: AdmZip.IZipEntry[], name: string) {
    let f = this.getZippedFile(files, name);
    if (f === null) return [];
    let txt = f.getData().toString();
    let cleanedText = txt.trim(); // .substr(1, txt.length - 2); //sof and eof chars
    return UploadHelper.readCsvString(cleanedText)
  }

  static readZippedImage(files: AdmZip.IZipEntry[], photoUrl: string) {
    return new Promise<string>((resolve, reject) => {
      let file = this.getZippedFile(files, photoUrl);
      if (file === null) reject(new DOMException("Did not find image"));
      else {
        let buffer = file.getData();
        resolve("data:image/png;base64," + buffer.toString("base64"));
      }
    });
  }

  static readImage(files: FileList, photoUrl: string) {
    return new Promise<string>((resolve, reject) => {
      let match = false;
      for (let i = 0; i < files.length; i++) {
        if (files[i].name === photoUrl) {
          const reader = new FileReader();
          reader.onload = () => { resolve(reader.result.toString()); };
          reader.onerror = () => { reject(new DOMException("Error reading image")) }
          reader.readAsDataURL(files[i]);
        }
      }
      if (match) reject(new DOMException("Did not find image"));
    });
  }

  static getStrippedRecord(r: any) {
    let names = Object.getOwnPropertyNames(r)
    for (let j = names.length - 1; j >= 0; j--) {
      let n = names[j];
      if (r[n] === "") delete r[n];
    }
    return r;
  }

}
