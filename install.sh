#!/bin/bash
set -e

yarn install
(cd client && yarn install)
(cd server && yarn install)
