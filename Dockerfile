FROM node:9.3.0-alpine

WORKDIR /opt

ADD . . 

RUN apk update && apk add nodejs-npm && npm install

ENTRYPOINT ["npm", "start"]