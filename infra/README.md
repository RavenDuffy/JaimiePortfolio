## Creating a new user

### Index

1. IAM Config
2. Local .aws

### IAM Config

1. Open the IAM section, then go to Users
2. Select "Create user"
3. Create a user under the name "CDK_USER"
4. In the permissions, select attach policies directly, then select "AdministratorAccess"
5. Finish up and create the new user

### Local .aws

1. Open your preferred terminal (at ~/)
2. Run `mkdir .aws` to create a new directory for aws
3. Run `cd .aws` to end the newly created directory
4. Create a new file in this directory named "config" using your preferred editor (i.e. using vim `vim config`)
5. Inside the "config" file enter the following two lines `[profile jaimie]` and `region=eu-west-2`, then save and exit (i.e. using vim `:wq`)
6. Create another new file in the .aws directory named "credentials"
7. Inside the "credentials" file enter the line `[jaimie]` (this should use the same name as step 5)

**The following steps require the IAM config section to be completed**

8. In the CDK_USER previously created, select security credentials
9. Select "Create access key"
10. Select the first option "CLI", accept the confirmation and select next
11. Skip creating the tag (unless you want this) and create the key
12. On the resulting page copy the "Access key" and "Secret access key"
13. In the "credentials" file (from step 6), add the following lines: `aws_access_key_id=[Access key here]` and `aws_secret_access_key=[Secret access key here]`

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
