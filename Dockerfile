FROM node:4

MAINTAINER  Chris Hiestand, chrishiestand@gmail.com

WORKDIR /opt/importer
ENTRYPOINT ["node", "/opt/importer/build/index.js"]

COPY /tls /opt/importer/tls
COPY auth.basic /opt/importer/auth.basic
COPY package.json /opt/importer/package.json
COPY /node_modules /opt/importer/node_modules
COPY /build /opt/importer/build
