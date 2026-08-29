import Airtable from "airtable";
import { getSecret } from "astro:env/server";
import fs from "fs/promises";
import { existsSync } from "fs";

export const base = Airtable.base(getSecret("AIRTABLE_BASE_ID")!);

const FILES_DIR =
  process.env.NODE_ENV === "development" ? "./public/files" : "./dist/files";

export async function downloadedFile(url: string) {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();

    if (!existsSync(FILES_DIR)) {
      fs.mkdir(FILES_DIR, { recursive: true });
    }

    const fileId = url.split("/").at(-1);
    const filePath = `${FILES_DIR}/${fileId}`;

    await fs.writeFile(filePath, new Uint8Array(buffer));

    return `/files/${fileId}`;
  } catch (e) {
    console.error(e);
    return "/favicon.ico";
  }
}
