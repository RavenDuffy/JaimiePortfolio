import fs from "fs"

export default ({ env }) => {
  const connection = {
    client: "postgres",
    connection: {
      connectionString: "",
      host: env("DATABASE_HOST", "localhost"),
      port: env.int("DATABASE_PORT", 5432),
      database: env("DATABASE_NAME", "strapi"),
      user: env("DATABASE_USERNAME", ""),
      password: env("DATABASE_PASSWORD", ""),
      schema: env("DATABASE_SCHEMA", "public"),
      ssl: env("DATABASE_SSL", false) && {
        ca: fs.readFileSync(`/home/ec2-user/rds.crt`),
      },
    },
    useNullAsDefault: true,
  }

  return {
    connection: {
      ...connection,
      defaultConnection: "default",
      acquireConnectionTimeout: env.int("DATABASE_CONNECTION_TIMEOUT", 60000),
      pool: { min: 2, max: 10 },
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
}
