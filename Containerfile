FROM node:22-alpine

WORKDIR /app

COPY ui/package*.json ./
RUN npm install
COPY ui/ .

RUN npm run build
CMD ["npm", "run", "start"]
