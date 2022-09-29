FROM node:16

RUN apt update && apt install -y vim

WORKDIR /app/

COPY dist ./dist
COPY server ./server
COPY package.json ./

ENV PATH="/app/server/node_modules/pm2/bin:${PATH}"
CMD npm run start:docker
