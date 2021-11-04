FROM node:16
EXPOSE 8081
RUN mkdir -p /srv/app/example
WORKDIR /srv/app
ADD ./index.js .
ADD ./package.json .
RUN npm install --production
WORKDIR /srv/app/example
ADD ./example/* ./
RUN npm install
CMD npm start