FROM registry.access.redhat.com/ubi9/nodejs-22:9.5-1730543890

WORKDIR /opt/app-root/src

COPY package*.json ./
RUN npm install
COPY ./ .

RUN npm run build
CMD ["npm", "run", "start"]
