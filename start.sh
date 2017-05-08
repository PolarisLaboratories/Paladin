#!/bin/bash

set -e

cd ~/Paladin
pm2 start bin/www -n www -i 0
