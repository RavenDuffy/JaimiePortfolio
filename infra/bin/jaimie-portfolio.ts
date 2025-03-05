#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { JaimiePortfolioStack } from "../lib/jaimie-portfolio-stack"
import { resolve } from "path"

console.log(`Looking for .env in ${resolve(__dirname, "../../.env")} }.`)
require("dotenv").config({
  path: resolve(__dirname, "../../.env"),
})

const clientName = process.env.CLIENT_NAME
const projectName = process.env.PROJECT_NAME
const baseDomain = process.env.DOMAIN_NAME

const gitUsername = process.env.GIT_USERNAME
const gitEmail = process.env.GIT_EMAIL
const gitRepoUrl = process.env.GIT_REPO_URL

const dbHost = process.env.DATABASE_HOST
const dbPort = process.env.DATABASE_PORT
const dbName = process.env.DATABASE_NAME
const dbUsername = process.env.DATABASE_USERNAME
const dbPassword = process.env.DATABASE_PASSWORD

const awsRegion = process.env.AWS_REGION
const awsKey = process.env.AWS_ACCESS_KEY_ID
const awsSecret = process.env.AWS_SECRET_ACCESS_KEY

const jwtSecret = process.env.JWT_SECRET
const strapiPass = process.env.STRAPI_PASS

const errors = Object.entries({
  clientName,
  projectName,
  baseDomain,
  gitUsername,
  gitEmail,
  gitRepoUrl,
  dbHost,
  dbPort,
  dbName,
  dbUsername,
  dbPassword,
  awsKey,
  awsSecret,
  awsRegion,
  jwtSecret,
  strapiPass,
})
  .map(([key, value]) => {
    if (typeof value === "undefined") return key
    else return undefined
  })
  .filter((property) => property)
if (errors.length > 0) {
  throw new Error(
    `The following env var(s) are undefined: ${errors.join(", ")}`
  )
}

const app = new cdk.App()
new JaimiePortfolioStack(app, `Infra${clientName}${projectName}Stack-dev`, {
  domainName: baseDomain!,
  clientName: clientName!,
  projectName: projectName!,
  environment: "development",
  siteSubDomain: "dev",
  env: {
    region: awsRegion,
  },
})

new JaimiePortfolioStack(app, `Infra${clientName}${projectName}Stack-prod`, {
  domainName: baseDomain!,
  clientName: clientName!,
  projectName: projectName!,
  environment: "production",
  localEnv: {
    GIT_USERNAME: gitUsername!,
    GIT_EMAIL: gitEmail!,
    GIT_REPO_URL: gitRepoUrl!,
    NODE_ENV: "production",
    DATABASE_PORT: dbPort!,
    DATABASE_USERNAME: dbUsername!,
    DATABASE_PASSWORD: dbPassword!,
    AWS_REGION: awsRegion!,
    AWS_ACCESS_KEY_ID: awsKey!,
    AWS_SECRET_ACCESS_KEY: awsSecret!,
    STRAPI_PASS: strapiPass!,
  },
  env: {
    region: awsRegion,
  },
})
