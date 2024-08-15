FROM node:12-alpine

WORKDIR /code

RUN apk update; apk add tzdata
RUN ln -sf /usr/share/zoneinfo/Asia/Jakarta /etc/localtime
RUN apk add --update python make g++\
   && rm -rf /var/cache/apk/*

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 7067
CMD [ "node", "index.js" ]