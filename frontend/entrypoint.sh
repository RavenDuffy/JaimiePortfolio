#!/bin/sh
if [ $NODE_ENV == "production" ]
  then
    yarn install --production=false
    yarn build
    yarn start
  else
    yarn install
    yarn dev
fi
