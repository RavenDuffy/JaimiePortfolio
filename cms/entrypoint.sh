#!/bin/sh
if [ $NODE_ENV == "production" ]
  then
    yarn install --production=false
    yarn disable-telemetry
    yarn build 
    yarn start
  else
    yarn install
    yarn disable-telemetry
    yarn develop --watch-admin
fi
