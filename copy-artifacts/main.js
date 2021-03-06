// Simon Edwards <simon@simonzone.com>
// https://github.com/sedwards2009/extraterm-devops
// License: MIT

const log = console.log.bind(console);

const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const {Storage} = require('@google-cloud/storage');

const ARTIFACT_PATH = "../../extraterm.artifacts";

async function main() {
  const keyPath = process.argv[2];
  log("keyPath: " + keyPath)
  const storage = new Storage({
    projectId: "extraterm",
    keyFilename: keyPath
  });
  const bucket = storage.bucket("extraterm_builds");

  const dirBase = dayjs().format("YYYY-MM-DD HH:mm:ss");

  for (const dirEntry of fs.readdirSync(ARTIFACT_PATH)) {
    const dirPath = path.join(ARTIFACT_PATH, dirEntry);
    for (const entry of fs.readdirSync(dirPath)) {
      const destinationPath = dirBase + "/" + entry;
      log(`Uploading ${entry} to ${destinationPath}`);

      await bucket.upload(path.join(dirPath, entry), {
        destination: destinationPath,
        resumable: false,
        validation: "crc32c",
      });
    }
  }  
  // Trigger the  GCP function to clean up the old files.
  await bucket.upload("request_clean", {
    destination: "request_clean",
    resumable: false,
    validation: "crc32c",
  });

  log("Done");
}

main();
