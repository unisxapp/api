#!/bin/bash

set -e

SSH_HOST=$1

cd $(dirname $0)

if [ -z $SSH_HOST ] ; then
  echo SSH_HOST is not specified
  exit 1
fi

echo 'Install nginx'
ssh $SSH_HOST sudo bash -e <<-EOF
  if ! which nginx ; then
    apt-get -y install nginx
  fi
EOF

echo 'Create dir'
ssh $SSH_HOST sudo bash -e <<-EOF
  mkdir -p /opt/api
EOF

echo 'Copy files'
rsync -r --rsync-path='sudo rsync' ./docker-compose.yml api.conf $SSH_HOST:/opt/api

ssh $SSH_HOST bash -e <<-EOF
  cd /opt/api
  echo 'Reload nginx'
  sudo cp /opt/api/api.conf /etc/nginx/sites-available
  sudo ln -sf /etc/nginx/sites-{available,enabled}/api.conf
  sudo nginx -s reload
  echo 'Run docker compose'
  docker-compose up -d
EOF
