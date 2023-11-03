FROM node:16-alpine
WORKDIR "/qate3-backend"
COPY ./package.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]