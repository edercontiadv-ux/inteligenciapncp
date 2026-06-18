# ─── Imagem base leve ───────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Dependências do sistema (necessário para fpdf2 e compilação de algumas libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências Python primeiro (cache de camadas)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Porta padrão do Cloud Run
EXPOSE 8080

# Inicia o Streamlit na porta do Cloud Run ($PORT ou 8080)
CMD streamlit run app.py \
    --server.port=${PORT:-8080} \
    --server.address=0.0.0.0 \
    --server.headless=true \
    --server.enableCORS=false \
    --server.enableXsrfProtection=false
