FROM node:20-slim

# Install Python 3 and pip
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies into /app/.venv
COPY requirements.txt .
RUN python3 -m venv /app/.venv && /app/.venv/bin/pip install --no-cache-dir -r requirements.txt

# Install Node dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy all project files
COPY . .

EXPOSE 5000
CMD ["node", "server/server.js"]