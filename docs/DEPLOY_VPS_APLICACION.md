# Despliegue de la aplicación completa en VPS

La aplicación principal (Pygame) se ejecuta en el servidor y se accede desde el navegador mediante noVNC. No es la landing HTML: es el **juego completo** con todas las funcionalidades.

---

## Requisitos del VPS

- **OS:** Ubuntu 22.04 LTS o Debian 12 (recomendado)
- **RAM:** 1 GB mínimo (2 GB recomendado)
- **Docker** y **Docker Compose** instalados
- **Puerto 6080** abierto (o el que configures)

---

## 1. Instalar Docker en el VPS

```bash
# Conectar por SSH
ssh root@TU_IP_VPS

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose (plugin)
apt install -y docker-compose-plugin
```

---

## 2. Clonar y construir

```bash
cd /opt  # o /home/tu_usuario
git clone https://github.com/TU_USUARIO/artificial-word.git
cd artificial-word
```

---

## 3. Construir la imagen

```bash
docker build -f Dockerfile.vps -t artificial-world .
```

---

## 4. Ejecutar

### Opción A: Docker Compose (recomendado)

```bash
docker compose -f docker-compose.vps.yml up -d
```

### Opción B: Docker run

```bash
docker run -d --name artificial-world -p 6080:6080 artificial-world
```

---

## 5. Acceder al juego

Abre en el navegador:

```
http://TU_IP_VPS:6080/vnc.html
```

O si tienes dominio:

```
https://juego.tudominio.com/vnc.html
```

Haz clic en **"Connect"** y verás la ventana del juego. Puedes jugar con teclado y ratón como en la versión de escritorio.

---

## 6. Comandos útiles

```bash
# Ver logs
docker compose -f docker-compose.vps.yml logs -f

# Parar
docker compose -f docker-compose.vps.yml down

# Reiniciar
docker compose -f docker-compose.vps.yml restart
```

---

## 7. HTTPS con Nginx (opcional)

Si quieres servir el juego por HTTPS detrás de Nginx:

```nginx
# /etc/nginx/sites-available/artificial-world
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl;
    server_name juego.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/juego.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/juego.tudominio.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:6080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/artificial-world /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 8. Persistencia (guardar/cargar)

Por defecto, los datos (BD, logs) se pierden al reiniciar el contenedor. Para persistir:

1. Crea una carpeta en el host: `mkdir -p ./data`
2. Edita `docker-compose.vps.yml` y descomenta el volumen
3. Configura la app para escribir en `/app/data` (requiere cambios en `configuracion.py`)

O usa un volumen con nombre:

```yaml
volumes:
  - artificial-world-data:/app
```

*(Nota: montar `/app` completo puede ocultar el código; preferible montar solo una subcarpeta de datos.)*

---

## 9. Resolución de problemas

| Problema | Solución |
|----------|----------|
| Pantalla negra al conectar | Espera 10–15 s tras `docker compose up`. El juego tarda en arrancar. Si sigue negro: `docker compose logs` para ver errores de Python. |
| Pantalla negra persistente | Reconstruye la imagen: `docker compose build --no-cache` y vuelve a levantar. Revisa `docker compose logs artificial-world` por excepciones. |
| "Connection refused" | Comprueba que el puerto 6080 está abierto en el firewall del VPS. |
| Juego muy lento | Aumenta RAM del VPS o reduce `fps_objetivo` en `configuracion.py`. |
| Error al construir | Verifica que `novnc`, `websockify` y `fonts-liberation` están en los repos de tu distro. |

---

## Resumen

- **Aplicación:** Juego completo Pygame (no la landing HTML)
- **Acceso:** Navegador → `http://IP:6080/vnc.html`
- **Tecnología:** Xvfb + x11vnc + noVNC
- **Persistencia:** Opcional, configurable por volumen
