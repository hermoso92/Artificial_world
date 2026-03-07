# Despliegue en Hostinger VPS — artificial word

**Empezando desde cero.** La aplicación no se ha desplegado antes.

---

## 0. Resumen rápido

1. Copia `.env.example` → `.env` y rellena tus valores (API keys, SSH, etc.)
2. Nunca compartas ni subas `.env` a Git
3. Usa `utilidades/secrets.py` en Python para leer variables
4. Scripts de deploy: `scripts/deploy_landing.ps1` (Windows) o `deploy_landing.sh` (Linux)

---

## 1. Cómo guardar secretos (API keys, etc.)

### Regla de oro
**NUNCA** compartas API keys en chat, email o código. **NUNCA** las subas a Git.

### Opción A: Archivo `.env` (local y VPS)

```bash
# En la raíz del proyecto
cp .env.example .env
# Edita .env con tus valores reales
```

El archivo `.env` está en `.gitignore` — no se sube a Git.

### Opción B: Variables de entorno en el sistema

```bash
# Linux/macOS
export OPENAI_API_KEY="sk-..."
export OPENAI_API_KEY="sk-..."  # En ~/.bashrc o ~/.profile para persistir
```

### Opción C: Hostinger — Panel de control

En Hostinger VPS:
1. Panel → **Advanced** → **Environment Variables**
2. Añade `OPENAI_API_KEY`, etc.
3. Se inyectan en el proceso al arrancar

### En Python

```python
import os
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    # Fallback o error según tu lógica
    pass
```

---

## 2. Requisitos del VPS (Hostinger)

- **OS:** Ubuntu 22.04 LTS (recomendado)
- **RAM:** 1 GB mínimo (2 GB mejor para producción)
- **SSH** activado

---

## 3. Primer despliegue (desde cero)

### Paso 1: Conectar por SSH

```bash
ssh root@TU_IP_VPS
# O con clave: ssh -i ~/.ssh/tu_clave root@TU_IP_VPS
```

### Paso 2: Instalar dependencias base

```bash
apt update && apt upgrade -y
apt install -y nginx python3 python3-pip python3-venv git
```

### Paso 3: Crear usuario (recomendado, no usar root)

```bash
adduser artificialword
usermod -aG sudo artificialword
su - artificialword
```

### Paso 4: Clonar el proyecto

```bash
cd /home/artificialword
git clone https://github.com/TU_USUARIO/artificial-word.git
cd artificial-word
```

### Paso 5: Landing estática (nginx)

```bash
# Copiar landing a nginx
sudo cp docs/index.html /var/www/html/artificialword/
# O configurar un virtual host para artificialword.tudominio.com
```

**Ejemplo de virtual host nginx:**

```nginx
# /etc/nginx/sites-available/artificialword
server {
    listen 80;
    server_name artificialword.tudominio.com;
    root /var/www/html/artificialword;
    index index.html;
    location / {
        try_files $uri $uri/ =404;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/artificialword /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Paso 6: Variables de entorno (si usas APIs)

```bash
# En el VPS
nano /home/artificialword/artificial-word/.env
# Añade OPENAI_API_KEY=sk-... etc.
# Guarda y asegura permisos:
chmod 600 .env
```

---

## 4. Estructura actual vs. futuro

| Componente | Estado actual | En VPS |
|------------|---------------|--------|
| Landing (`docs/index.html`) | Listo | Servir con nginx |
| Simulación Python (pygame) | Desktop | No corre en servidor (necesita display) |
| API / backend | No existe | Futuro: FastAPI/Flask para demos B2B |

**Nota:** La simulación es una app de escritorio (pygame). Para demos web habría que crear un backend que ejecute el motor y exponga resultados vía API.

---

## 5. Checklist primer despliegue

- [ ] VPS creado en Hostinger
- [ ] SSH configurado (clave recomendada)
- [ ] Nginx instalado
- [ ] Landing copiada a `/var/www/html/artificialword/`
- [ ] Dominio apuntando al VPS (A record)
- [ ] `.env` creado (sin commitear) si usas APIs
- [ ] Certificado SSL (Let's Encrypt) para HTTPS

---

## 6. SSL con Let's Encrypt (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d artificialword.tudominio.com
```

---

## 7. Próximos pasos (magnitud)

1. **Landing en vivo** — Dominio + HTTPS
2. **API de demo** — Backend que ejecute el motor y devuelva JSON (para estudios)
3. **Integración OpenAI** — Si añades features con LLM (diálogos, etc.)
4. **CI/CD** — GitHub Actions que despliegue al hacer push a `main`

Cuando quieras, podemos concretar el paso 2 (API de demo) o el 3 (OpenAI).
