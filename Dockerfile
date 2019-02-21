FROM node

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm install

COPY server.js .
COPY libs ./libs
COPY index.html .

ENV PRODUCTION=true PORT=8080

EXPOSE 8080

CMD [ "npm", "start" ]
