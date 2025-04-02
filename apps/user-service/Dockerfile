FROM node:18-alpine As build

WORKDIR /usr/src/app

# Copy package.json và các file cần thiết
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copy source code
COPY apps/user-service ./apps/user-service
COPY libs ./libs

# Cài đặt dependencies và build
RUN npm install
RUN npm run build user-service

# Production stage
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json và cài đặt dependencies production
COPY package*.json ./
RUN npm install --omit=dev

# Copy build output
COPY --from=build /usr/src/app/dist ./dist

# Cài đặt các biến môi trường
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Command để chạy ứng dụng
CMD ["node", "dist/apps/user-service/main"]