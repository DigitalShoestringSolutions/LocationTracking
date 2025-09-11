FROM node:24-alpine AS appbuild
COPY ./code/package.json /
RUN npm install
RUN npm -v
COPY ./code /
RUN npm run build

FROM nginx
COPY --from=appbuild /dist /usr/share/nginx/html

COPY ./code/nginx_config/nginx.conf /etc/nginx/nginx.conf
COPY ./code/nginx_config/default.conf /etc/nginx/conf.d/default.conf

COPY --from=solution_config ui/. /usr/share/nginx/html/config/
