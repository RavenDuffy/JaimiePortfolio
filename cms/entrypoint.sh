#!/bin/sh
if [ $NODE_ENV == "production" ]
  then
    npm install --production=false
    npm run strapi telemetry:disable
    npm run build 
    npm run start
  else
    npm install
    npm run strapi telemetry:disable
    npm run develop --watch-admin
fi
