# Build the assets.
FROM node:lts-alpine

USER root

RUN apk add --no-cache \
  g++ \
  make \
  python

USER node

ENV WORKSPACE=/home/node
WORKDIR $WORKSPACE

COPY --chown=node:node $PWD $WORKSPACE

RUN ["npm", "ci"]
RUN ["npm", "run", "build"]

# Install production dependencies only.
FROM node:lts-alpine

USER root

RUN apk add --no-cache \
  g++ \
  make \
  python

USER node

ENV WORKSPACE=/home/node
WORKDIR $WORKSPACE

COPY --chown=node:node $PWD/package.json $WORKSPACE
COPY --chown=node:node $PWD/package-lock.json $WORKSPACE

RUN ["npm", "ci", "--production", "--global-style"]

# Build the final image.
FROM node:lts-alpine

USER node

ENV WORKSPACE=/home/node

WORKDIR $WORKSPACE

COPY --from=0 --chown=node:node /home/node/dist/ $WORKSPACE/dist/
COPY --from=1 --chown=node:node /home/node/node_modules/ $WORKSPACE/node_modules/

EXPOSE 3040

CMD ["node", "dist/server/main.js"]
