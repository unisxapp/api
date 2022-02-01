FROM node:14-slim

WORKDIR /api

COPY package.json package-lock.json ./

RUN npm install --only=prod

COPY src ./

ENTRYPOINT ["node", "--unhandled-rejections=strict", "index.js"]
