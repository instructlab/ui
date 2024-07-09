FROM python:3.11

# Set working directory
WORKDIR /app

RUN pip install --upgrade pip
RUN pip install --no-cache-dir instructlab==0.16.1

# Copy project files to the working directory
COPY config.yaml .

# Download the merlinite model
RUN ilab download

# Copy project files to the working directory
COPY . .

EXPOSE 8000

# Run the chat server with the specified model family and model file
CMD ["ilab", "serve", "--model-family", "merlinite", "--model-path", "models/merlinite-7b-lab-Q4_K_M.gguf"]