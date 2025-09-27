# Configuration

This guide covers all configuration options for the Ethereum Server API.

## Environment Variables

The server uses environment variables for configuration. Create a `.env` file in your project root:

```env
# Akave O3 Configuration
AKAVE_ENDPOINT=https://o3.akave.xyz
AKAVE_ACCESS_KEY_ID=your-access-key-here
AKAVE_SECRET_ACCESS_KEY=your-secret-access-key

# Server Configuration
PORT=3000

# Optional: Ethereum RPC Provider
ETHEREUM_RPC_URL=https://eth.llamarpc.com
```

## Akave O3 Setup

### 1. Get Akave O3 Credentials

1. Visit the [Akave O3 documentation](https://docs.akave.xyz/akave-o3/)
2. Create an account and get your access credentials
3. Note down your `accessKeyId` and `secretAccessKey`

### 2. Configure Environment

```env
AKAVE_ENDPOINT=https://o3.akave.xyz
AKAVE_ACCESS_KEY_ID=your-actual-access-key
AKAVE_SECRET_ACCESS_KEY=your-actual-secret-key
```

### 3. Test Connection

```bash
curl -X POST http://localhost:3000/upload-image \
  -F "image=@test-image.jpg" \
  -F "bucket=test-bucket"
```

## Server Configuration

### Port Configuration

```env
PORT=3000  # Default port
```

The server will start on the specified port. If not specified, defaults to 3000.

### CORS Configuration

The server includes CORS middleware for cross-origin requests:

```javascript
app.use(cors());
```

To customize CORS settings, modify `server.js`:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true
}));
```

## File Upload Configuration

### File Size Limits

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
```

### Supported File Types

The server accepts all image types:
- JPEG/JPG
- PNG
- GIF
- WebP
- BMP
- TIFF

### Image Processing Settings

```javascript
// Image optimization settings
const processedImageBuffer = await sharp(file.buffer)
  .resize(1920, 1080, { 
    fit: 'inside',
    withoutEnlargement: true 
  })
  .jpeg({ quality: 85 })
  .toBuffer();
```

## Ethereum Configuration

### RPC Provider

The server uses a public Ethereum RPC endpoint by default:

```javascript
const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
```

### Custom RPC Provider

To use a different RPC provider:

1. **Infura**:
   ```javascript
   const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID');
   ```

2. **Alchemy**:
   ```javascript
   const provider = new ethers.JsonRpcProvider('https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY');
   ```

3. **Custom Node**:
   ```javascript
   const provider = new ethers.JsonRpcProvider('http://localhost:8545');
   ```

### Network Configuration

To use different networks, modify the provider URL:

```javascript
// Mainnet
const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

// Goerli Testnet
const provider = new ethers.JsonRpcProvider('https://goerli.infura.io/v3/YOUR_PROJECT_ID');

// Polygon
const provider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
```

## Face Recognition Configuration

### Face Detection Settings

```javascript
// Face detection image processing
const processedBuffer = await sharp(file.buffer)
  .resize(800, 600, { 
    fit: 'inside',
    withoutEnlargement: true 
  })
  .jpeg({ quality: 90 })
  .toBuffer();
```

### Face Registration Settings

```javascript
// Face registration image processing
const processedBuffer = await sharp(file.buffer)
  .resize(400, 400, { 
    fit: 'cover'
  })
  .jpeg({ quality: 85 })
  .toBuffer();
```

### Confidence Threshold

```javascript
const threshold = 0.7; // Minimum confidence threshold for face recognition
```

## Security Configuration

### Rate Limiting

Add rate limiting middleware:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### Input Validation

The server includes built-in validation for:
- Ethereum addresses
- File types and sizes
- Required fields
- Signature format

### CORS Security

For production, configure specific origins:

```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

## Production Configuration

### Environment Variables for Production

```env
# Production Environment
NODE_ENV=production
PORT=3000

# Akave O3 Production
AKAVE_ENDPOINT=https://o3.akave.xyz
AKAVE_ACCESS_KEY_ID=production-access-key
AKAVE_SECRET_ACCESS_KEY=production-secret-key

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Database Configuration (Optional)

For production, consider using a database for face storage:

```javascript
// Example with MongoDB
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

## Monitoring Configuration

### Health Check Endpoint

The server includes a health check endpoint:

```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "registeredFaces": 5
}
```

### Logging Configuration

Add structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Next Steps

- [API Reference](./api-reference.md) - Learn about all API endpoints
- [Usage Examples](./usage-examples.md) - See practical examples
- [Security Considerations](./security-considerations.md) - Production security tips
