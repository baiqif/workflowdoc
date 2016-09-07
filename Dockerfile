FROM node:4-onbuild
RUN mkdir -p /usr/src/app/logs
ENV NODE_ENV="local"
EXPOSE 8080

# Add Tini
ENV TINI_VERSION v0.10.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]
CMD [ "npm", "start" ]
