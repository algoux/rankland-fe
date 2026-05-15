FROM algoux/nodebase:20

WORKDIR /app/

COPY package.json ./
COPY server ./server
COPY dist ./dist

ENV PATH="/app/server/node_modules/pm2/bin:${PATH}"
CMD npm run start:docker
