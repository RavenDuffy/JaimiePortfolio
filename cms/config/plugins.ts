export default ({ env }) => {
  return {
    upload: {
      config: {
        provider: "aws-s3",
        providerOptions: {
          accessKeyId: env("AWS_ACCESS_KEY_ID"),
          secretAccessKey: env("AWS_ACCESS_SECRET_KEY"),
          region: env("AWS_REGION"),
          baseUrl: `https://s3.${env("AWS_REGION")}.amazonaws.com/${env(
            "DOMAIN_NAME"
          )}-strapi`,
          params: {
            ACL: env("AWS_ACL", "public-read"),
            Bucket: `${env("DOMAIN_NAME")}-strapi`,
          },
        },
      },
    },
  }
}
