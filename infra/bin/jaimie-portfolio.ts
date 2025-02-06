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
const awsRegion = process.env.AWS_REGION
const baseDomain = process.env.DOMAIN_NAME

const gitUsername = process.env.GIT_USERNAME
const gitEmail = process.env.GIT_EMAIL
const gitRepoUrl = process.env.GIT_REPO_URL

const errors = Object.entries({
  clientName,
  projectName,
  awsRegion,
  baseDomain,
  gitUsername,
  gitEmail,
  gitRepoUrl,
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
    GIT_USERNAME: process.env.GIT_USERNAME!,
    GIT_EMAIL: process.env.GIT_EMAIL!,
    GIT_REPO_URL: process.env.GIT_REPO_URL!,
    NODE_ENV: "production",
  },
  env: {
    region: awsRegion,
  },
})
