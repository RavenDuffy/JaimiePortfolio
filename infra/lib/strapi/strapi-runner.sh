#cloud-boothook
#!/bin/sh
yum update -y

if [ "production" = "{{NODE_ENV}}" ]; then
  BRANCH="main"
else
  BRANCH="develop"
fi
echo "Branch set to $BRANCH" >> /tmp/init-log.txt

echo "Setting env vars" >> /tmp/init-log.txt
echo export NODE_ENV="{{NODE_ENV}}" >> /etc/profile
echo export DATABASE_PORT="{{DATABASE_PORT}}" >> /etc/profile
echo export DATABASE_NAME="{{DATABASE_NAME}}" >> /etc/profile
echo export DATABASE_USERNAME="{{DATABASE_USERNAME}}" >> /etc/profile
echo export DATABASE_PASSWORD="{{DATABASE_PASSWORD}}" >> /etc/profile
echo export AWS_REGION="{{AWS_REGION}}" >> /etc/profile
echo export AWS_ACCESS_KEY_ID="{{AWS_ACCESS_KEY_ID}}" >> /etc/profile
echo export AWS_ACCESS_SECRET="{{AWS_ACCESS_SECRET}}" >> /etc/profile
echo export STRAPI_PASS="{{STRAPI_PASS}}" >> /etc/profile

echo export JWT_SECRET="$(openssl rand -base64 32)" >> /etc/profile
echo export APP_KEYS="$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)" >> /etc/profile
echo export API_TOKEN_SALT="$(openssl rand -base64 32)" >> /etc/profile
echo export ADMIN_JWT_SECRET="$(openssl rand -base64 32)" >> /etc/profile
echo export TRANSFER_TOKEN_SALT="$(openssl rand -base64 32)" >> /etc/profile

sudo curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install nodejs -y --best --allowerasing
echo "Node version $(node -e 'console.log(process.version)') installed" >> /tmp/init-log.txt

sudo yum install -y git
sudo touch /home/ec2-user/.gitconfig
git config --system user.name "{{GIT_USERNAME}}"
git config --system user.email "{{GIT_EMAIL}}"
echo "Installed and configured git" >> /tmp/init-log.txt

if [ ! -e "/home/ec2-user/cms" ]; then
  mkdir /home/ec2-user/github
  git clone -b $BRANCH -n --depth=1 --filter=tree:0 {{GIT_REPO_URL}} /home/ec2-user/github
  cd /home/ec2-user/github
  git sparse-checkout set --no-cone /cms /infra/lib/pm2/ecosystem.json
  git checkout
  sudo mv /home/ec2-user/github/cms /home/ec2-user/cms
  sudo mv /home/ec2-user/github/infra/lib/pm2/ecosystem.json /home/ec2-user/ecosystem.json
  sudo rm -rf /home/ec2-user/github
  sudo chmod -R 777 /home/ec2-user/cms/
  echo "Repo cloned to ~/cms" >> /tmp/init-log.txt

  cd /home/ec2-user/cms
  sudo npm install
  sudo npm i better-sqlite3
  sudo NODE_ENV="{{NODE_ENV}}" npm run build
  sudo chmod -R 777 /home/ec2-user/cms/dist
  echo "Installed cms modules" >> /tmp/init-log.txt
else
  echo "Found cms modules; skipping" >> /tmp/init-log.txt
fi

cd /home/ec2-user
sudo npm i -g pm2 bun
sudo rm -rf /home/ec2-user/ecosystem.json
sudo chmod -R 777 /home/ec2-user/ecosystem.json
pm2 start /home/ec2-user/ecosystem.config.json
echo "Preparing pm2" >> /tmp/init-log.txt
