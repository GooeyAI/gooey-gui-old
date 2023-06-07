#!/usr/bin/env bash
set -ex
echo $GOOGLE_APPLICATION_CREDENTIALS_JSON > serviceAccountKey.json
export GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
npm run start
