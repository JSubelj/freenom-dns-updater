FROM node

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

COPY dns-updater.js .
COPY libs ./libs

ENV production=true

EXPOSE 8080

CMD [ "npm", "start" ]
