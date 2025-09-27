# Installation

This guide will help you install and set up the Ethereum Server API on your system.

## Prerequisites

Before installing the server, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Check Your Installation

```bash
node --version  # Should be 18.0+
npm --version   # Should be 8.0+
git --version   # Any recent version
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ethereum-server-api
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies:
- `express` - Web framework
- `ethers` - Ethereum library
- `@aws-sdk/client-s3` - S3-compatible client for Akave O3
- `multer` - File upload middleware
- `sharp` - Image processing
- `canvas` - Canvas API for Node.js
- `cors` - Cross-origin resource sharing

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Akave O3 Configuration
AKAVE_ENDPOINT=https://o3.akave.xyz
AKAVE_ACCESS_KEY_ID=your-access-key-here
AKAVE_SECRET_ACCESS_KEY=your-secret-access-key

# Server Configuration (optional)
PORT=3000
```

### 4. Start the Server

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

### 5. Verify Installation

Test that the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "registeredFaces": 0
}
```

## Docker Installation (Alternative)

If you prefer using Docker:

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Build and Run

```bash
docker build -t ethereum-server-api .
docker run -p 3000:3000 --env-file .env ethereum-server-api
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Change the port in your `.env` file:
```env
PORT=3001
```

#### Missing Dependencies
```bash
Error: Cannot find module 'express'
```

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### Akave O3 Connection Issues
```bash
Error: AWS SDK S3 client connection failed
```

**Solution**: Verify your Akave O3 credentials in the `.env` file and ensure the endpoint is correct.

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.0 | 20.0+ |
| RAM | 512MB | 2GB+ |
| Storage | 100MB | 1GB+ |
| CPU | 1 core | 2+ cores |

## Next Steps

- [Configuration Guide](./configuration.md) - Configure your environment
- [API Reference](./api-reference.md) - Learn about the API endpoints
- [Usage Examples](./usage-examples.md) - See practical examples

## Getting Help

If you encounter issues during installation:

1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Verify your system meets the requirements
3. Ensure all dependencies are properly installed
4. Check your environment configuration

Ready to configure your server? Let's move on to the [configuration guide](./configuration.md)!
