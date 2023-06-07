#!/usr/bin/env bash
echo $GOOGLE_APPLICATION_CREDENTIALS_JSON > serviceAccountKey.json
set -ex
export GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
npm run start
