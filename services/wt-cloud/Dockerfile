FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY services/wt-cloud/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY services/wt-cloud/ ./

ENV PYTHONPATH=/app
ENV WT_CLOUD_PORT=8000
ENV WT_CLOUD_HOST=0.0.0.0

EXPOSE 8000

CMD ["python", "run.py"]
