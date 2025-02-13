console.log("CWD:", process.cwd())

export default {
  apps: [
    {
      name: "cms",
      cwd: "/home/ec2-user/cms",
      scripts: "npm",
      args: "start",
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_HOST: process.env.DATABASE_HOST,
        DATABASE_PORT: process.env.DATABASE_PORT,
        DATABASE_NAME: process.env.DATABASE_NAME,
        DATABASE_USERNAME: process.env.DATABASE_USERNAME,
        DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
        AWS_REGION: process.env.AWS_REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_ACCESS_SECRET: process.env.AWS_ACCESS_SECRET,
      },
    },
  ],
}
