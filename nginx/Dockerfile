ARG PROTOCOL=http

FROM nginx:1.23.1-alpine AS nginx

FROM nginx AS build_http
WORKDIR /etc/nginx
COPY default.conf.template ./templates/

FROM build_http AS build_https
COPY www_theoneplaylist_com.crt www_theoneplaylist_com.key ./.ssl/

FROM build_$PROTOCOL
