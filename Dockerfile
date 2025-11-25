FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE ${PORT}

CMD ["node", "src/index.js"]

