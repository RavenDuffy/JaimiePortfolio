export default ({ env }) => {
  return [
    "strapi::logger",
    "strapi::errors",
    env("LOCAL") === "yes"
      ? "strapi::security"
      : {
          name: "strapi::security",
          config: {
            contentSecurityPolicy: {
              useDefaults: true,
              directives: {
                "connect-src": ["'self'", "https:"],
                "img-src": [
                  "'self'",
                  "data:",
                  "blob:",
                  "market-assets.strapi.io",
                  `${env("STRAPI_BUCKET")}.s3.${env("AWS_REGION")}.amazonaws.com`,
                ],
                "media-src": [
                  "'self'",
                  "data:",
                  "blob:",
                  "market-assets.strapi.io",
                  `${env("STRAPI_BUCKET")}.s3.${env("AWS_REGION")}.amazonaws.com`,
                ],
                upgradeInsecureRequests: null,
              },
            },
          },
        },
    "strapi::cors",
    "strapi::poweredBy",
    "strapi::query",
    "strapi::body",
    "strapi::session",
    "strapi::favicon",
    "strapi::public",
  ]
}
