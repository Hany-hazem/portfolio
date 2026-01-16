FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* /app/
RUN npm install --omit=dev
COPY . /app
ENV PORT=4001
EXPOSE 4001
CMD ["npm", "start"]