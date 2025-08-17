import Airtable from "airtable";
import { getSecret } from "astro:env/server";
import fs from "fs/promises";

Airtable.configure({
  apiKey: getSecret("AIRTABLE_API_KEY"),
});

export const base = Airtable.base(getSecret("AIRTABLE_BASE_ID")!);

const FILES_DIR = "./public/files";

export async function downloadedFile(url: string) {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();

    const fileId = url.split("/").at(-1);
    const filePath = `${FILES_DIR}/${fileId}`;

    await fs.writeFile(filePath, new Uint8Array(buffer));

    return `/files/${fileId}`;
  } catch (e) {
    console.error(e);
    return "/favicon.ico";
  }
}
