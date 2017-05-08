#!/bin/bash

set -e

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash

nvm install node

npm install -g pm2
pm2 update

