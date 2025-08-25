FROM node:18.19.0-slim as builder

LABEL description="TrueFit API Backend Docker Image"

# update packages and clean up
RUN apt-get update && apt-get upgrade -y && apt-get autoclean -y && apt-get autoremove -y
RUN apt install -y openssl

# install yarn
RUN curl -o- -L https://yarnpkg.com/install.sh | bash

# create nodejs user
RUN groupadd -r nodejs && useradd -g nodejs -s /bin/bash -d /home/nodejs -m nodejs
USER nodejs

# create app directory
RUN mkdir -p /home/nodejs/app/node_modules && chown -R nodejs:nodejs /home/nodejs/app

WORKDIR /home/nodejs/app

# set environment variables
ARG NODE_ENV=development

ENV NODE_ENV=${NODE_ENV}

ENV NPM_CONFIG_LOGLEVEL=warn
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# copy project definition/dependencies files, for better reuse of layers
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs yarn.lock ./
COPY --chown=nodejs:nodejs tsconfig.json ./
COPY --chown=nodejs:nodejs prisma ./prisma

# Install dependencies
RUN yarn install --pure-lockfile

# copy source code
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs scripts ./scripts

# Generate Prisma client
RUN npx prisma generate

# Build the application and copy assets
RUN yarn build && yarn copy 

# Remove dev dependencies first, then reinstall including TypeScript for scripts
RUN rm -rf node_modules
RUN yarn install --production --ignore-scripts --prefer-offline
RUN yarn add axios
RUN yarn add --dev typescript @types/node @types/jsonwebtoken @types/uuid @types/bcryptjs ts-node

# This results in a single layer image
FROM node:18.19.0-slim AS release

# Install necessary packages
RUN apt-get update && apt-get install -y netcat-traditional curl && rm -rf /var/lib/apt/lists/*

# create nodejs user
RUN groupadd -r nodejs && useradd -g nodejs -s /bin/bash -d /home/nodejs -m nodejs

# Install ts-node globally for running scripts
RUN npm install -g ts-node typescript

USER nodejs

# create app directory
RUN mkdir -p /home/nodejs/app/node_modules && chown -R nodejs:nodejs /home/nodejs/app

WORKDIR /home/nodejs/app

# copy built application from builder stage
COPY --from=builder /home/nodejs/app/dist ./dist
COPY --from=builder /home/nodejs/app/node_modules ./node_modules
COPY --from=builder /home/nodejs/app/package.json ./
COPY --from=builder /home/nodejs/app/prisma ./prisma

# copy source files and scripts (needed for ts-node execution)
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs scripts ./scripts
COPY --chown=nodejs:nodejs tsconfig.json ./

# Copy entrypoint script
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# exposed port/s
EXPOSE 4000

# Make entrypoint executable
USER root
RUN chmod +x /home/nodejs/app/docker-entrypoint.sh
USER nodejs

ENTRYPOINT ["./docker-entrypoint.sh"]
