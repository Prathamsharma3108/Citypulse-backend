FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose the port from your .env file
EXPOSE 5001

CMD ["npm", "start"]