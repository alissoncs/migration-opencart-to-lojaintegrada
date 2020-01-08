# Derivando da imagem oficial do MySQL
FROM mysql:5.7

COPY ./db/ /docker-entrypoint-initdb.d/