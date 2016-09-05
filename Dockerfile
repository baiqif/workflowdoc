FROM node:4-onbuild
RUN mkdir -p /usr/src/app/logs
ENV NODE_ENV="local"
EXPOSE 8080
