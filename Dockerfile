FROM node:24.13.0-alpine

WORKDIR /opt

ADD . . 

RUN apk update && apk add nodejs-npm && npm install

ENTRYPOINT ["npm", "start"]