FROM node:18.19.0

WORKDIR /opt/app

COPY package*.json ./

RUN npm install

COPY src ./src
COPY .babelrc ./
COPY config.js ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]