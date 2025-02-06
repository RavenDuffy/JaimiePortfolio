#cloud-boothook
#!/bin/sh
yum update -y

sudo curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
echo "node sourced" >> /tmp/init-log.txt
sudo yum install nodejs -y --best --allowerasing
echo "node installed" >> /tmp/init-log.txt

echo $(node -e "console.log(process.version)") > /tmp/init-log.txt

sudo yum install -y git
sudo touch /home/ec2-user/.gitconfig
git config --system user.name "{{GIT_USERNAME}}"
git config --system user.email "{{GIT_EMAIL}}"
echo "git installed and config done" >> /tmp/init-log.txt

if [ ! -e "/home/ec2-user/cms" ]; then
  mkdir /home/ec2-user/github
  git clone -n --depth=1 --filter=tree:0 {{GIT_REPO_URL}} /home/ec2-user/github
  cd /home/ec2-user/github
  git sparse-checkout set --no-cone /cms
  git checkout
  sudo mv /home/ec2-user/github/cms /home/ec2-user/cms
  sudo rm -rf /home/ec2-user/github
  cd /
  echo "repo cloned to ~/cms" >> /tmp/init-log.txt

  cd /home/ec2-user/cms
  npm install
  sudo NODE_ENV="{{NODE_ENV}}" npm run build
  echo "installed cms modules" >> /tmp/init-log.txt
else
  echo "skipping cms clone" >> /tmp/init-log.txt
fi