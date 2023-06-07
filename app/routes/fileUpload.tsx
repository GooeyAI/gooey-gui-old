import type { LoaderArgs } from "@remix-run/node";
import {
  json,
  unstable_composeUploadHandlers,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import type { Writable } from "stream";
import { Readable } from "stream";
import { getStorage } from "firebase-admin/storage";
import { initializeApp } from "firebase-admin/app";
import { v1 as uuid1 } from "uuid";
import path from "path";

const basePath = "daras_ai/media";

initializeApp({
  storageBucket: process.env["GS_BUCKET_NAME"]!,
});
const bucket = getStorage().bucket();

export async function action({ request }: LoaderArgs) {
  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, filename, contentType, data }) => {
      if (name !== "file") return undefined;
      const filePath = path.join(
        basePath,
        uuid1(),
        safeFilename(filename ?? "")
      );
      const file = bucket.file(filePath);
      const writable = file.createWriteStream({
        contentType: contentType,
      });
      await writeAsyncIterableToWritable(data, writable);
      return new URL(
        `${bucket.storage.apiEndpoint}/${bucket.name}/${filePath}`
      ).toString();
    }
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  return json({
    url: formData.get("file"),
  });
}

const FILENAME_WHITELIST = /[- a-zA-Z0-9_.]/g;

function safeFilename(filename: string) {
  const matches = filename.match(FILENAME_WHITELIST);
  if (matches) {
    filename = matches.join("");
  }
  const p = path.parse(filename);
  return truncateFilename(p.name) + p.ext;
}

function truncateFilename(text: string, maxlen = 100, sep = "...") {
  if (text.length <= maxlen) {
    return text;
  }
  if (sep.length > maxlen) {
    throw new Error("Separator length should not be greater than maxlen");
  }
  const mid = (maxlen - sep.length) / 2;
  return text.slice(0, mid) + sep + text.slice(-mid);
}

function writeAsyncIterableToWritable(
  iterable: AsyncIterable<Uint8Array>,
  writable: Writable
) {
  return new Promise((resolve, reject) => {
    const iterator = iterable[Symbol.asyncIterator]();
    const readable = new Readable({
      async read(size) {
        let total = 0;
        while (total < size) {
          let result:
            | IteratorYieldResult<Uint8Array>
            | IteratorReturnResult<any>;
          try {
            result = await iterator.next();
          } catch (e) {
            reject(e);
            return;
          }
          if (result.done) {
            readable.push(null);
            break;
          } else {
            readable.push(result.value);
            total += result.value.length;
          }
        }
      },
    });
    readable.pipe(writable).on("error", reject).on("finish", resolve);
  });
}
