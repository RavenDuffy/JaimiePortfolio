export default ({ env }) => {
  if (env("LOCAL") === "yes") return {}

  return {
    upload: {
      config: {
        provider: "aws-s3",
        providerOptions: {
          rootPath: env("STRAPI_BUCKET_ASSETS"),
          credentials: {
            accessKeyId: env("AWS_ACCESS_KEY_ID"),
            secretAccessKey: env("AWS_ACCESS_SECRET_KEY"),
          },
          region: env("AWS_REGION"),
          params: {
            ACL: env("AWS_ACL", "public-read"),
            Bucket: `${env("STRAPI_BUCKET")}`,
          },
        },
      },
    },
  }
}
