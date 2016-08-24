FROM node:4-onbuild
ADD /srv/workflowdoc/src /srv/workflowdoc/src
WORKDIR /srv/workflowdoc/src
RUN npm install
EXPOSE 3000

CMD node app.js