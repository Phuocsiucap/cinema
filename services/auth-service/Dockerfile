# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed for compilation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Use PORT environment variable (Render sets this automatically)
ENV PORT=10000

# Expose the port
EXPOSE $PORT

# Run the application - use environment variable for port
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$PORT"]