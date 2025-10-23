FROM node:20-alpine
WORKDIR /app

# Configurar zona horaria para Bolivia (UTC-4)
ENV TZ=America/La_Paz
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# ✅ Copiar package.json primero para cache de dependencias
COPY package*.json /app/
RUN npm install

# ✅ Copiar el resto del código
COPY . /app/

EXPOSE 5173
