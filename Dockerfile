FROM node:4-onbuild
VOLUME ["/srv/workflowdoc/:/usr/src/app"]
ENV NODE_ENV="local"
EXPOSE 8080
CMD node app.js


