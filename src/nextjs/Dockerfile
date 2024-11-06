# Dockerfile for development

# Use node 18-alpine as it's a small node image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# generated prisma files
COPY prisma /app/prisma/

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies in /next
RUN npm install

# Copy the rest of your application's code
COPY . .

# Ensure port 3000 is accessible to our system
EXPOSE 3000

# Run yarn dev, as we would via the command line 
# RUN ls -al
CMD ["npm", "run", "dev"]