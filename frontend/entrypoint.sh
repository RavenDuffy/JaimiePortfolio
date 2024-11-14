#!/bin/sh
if [ $NODE_ENV == "production" ]
  then
    npm install --production=false
    npm run build
    npm run start
  else
    npm install
    npm run dev
fi
