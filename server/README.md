# Ethereum Signature Verifier, ENS Lookup, Akave O3 Image Upload & Face Recognition Server

A comprehensive Node.js server that provides Ethereum signature verification, ENS lookup, decentralized image storage via Akave O3, and face recognition capabilities.

## Features

- **Signature Verification**: Verify Ethereum signatures against messages and addresses
- **ENS Lookup**: Look up ENS names for Ethereum addresses
- **Reverse ENS Lookup**: Resolve ENS names to Ethereum addresses
- **Image Upload**: Upload images to Akave O3 decentralized storage with automatic optimization
- **Face Detection**: Detect faces in uploaded images
- **Face Recognition**: Register and recognize faces using uploaded images
- **Health Check**: Basic health monitoring endpoint

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Ethereum & ENS

#### POST /verify-signature
Verify an Ethereum signature against a message and address.

**Request Body:**
```json
{
  "message": "Hello World",
  "signature": "0x...",
  "address": "0x..."
}
```

**Response:**
```json
{
  "isValid": true,
  "recoveredAddress": "0x...",
  "providedAddress": "0x...",
  "message": "Signature verification completed"
}
```

#### GET /ens-lookup/:address
Look up the ENS name for a given Ethereum address.

**Example:** `GET /ens-lookup/0x1234...`

**Response:**
```json
{
  "address": "0x1234...",
  "ensName": "vitalik.eth",
  "hasEnsName": true
}
```

#### GET /reverse-ens/:ensName
Resolve an ENS name to its Ethereum address.

**Example:** `GET /reverse-ens/vitalik.eth`

**Response:**
```json
{
  "ensName": "vitalik.eth",
  "address": "0x1234...",
  "isResolved": true
}
```

### Image Storage & Face Recognition

#### POST /upload-image
Upload an image to Akave O3 decentralized storage.

**Request:** FormData with `image` file and optional `bucket` field

**Response:**
```json
{
  "success": true,
  "fileName": "images/1234567890-abc123.jpg",
  "bucket": "default-images",
  "url": "https://o3.akave.xyz/default-images/images/1234567890-abc123.jpg",
  "size": 245760,
  "originalSize": 512000,
  "etag": "\"abc123def456\"",
  "message": "Image uploaded successfully to Akave O3"
}
```

#### POST /detect-faces
Detect faces in an uploaded image.

**Request:** FormData with `image` file

**Response:**
```json
{
  "success": true,
  "faceCount": 2,
  "imageSize": {
    "width": 800,
    "height": 600
  },
  "message": "Detected 2 face(s) in the image"
}
```

#### POST /register-face
Register a face for recognition.

**Request:** FormData with `image` file and `identifier` field

**Response:**
```json
{
  "success": true,
  "identifier": "john_doe",
  "totalFaces": 5,
  "message": "Face registered successfully"
}
```

#### POST /recognize-face
Recognize a face from an uploaded image.

**Request:** FormData with `image` file

**Response:**
```json
{
  "success": true,
  "match": {
    "identifier": "john_doe",
    "confidence": 0.85,
    "registeredAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Face recognized successfully"
}
```

#### GET /registered-faces
Get all registered faces.

**Response:**
```json
{
  "success": true,
  "faces": [
    {
      "identifier": "john_doe",
      "registeredAt": "2024-01-01T00:00:00.000Z",
      "imageSize": 245760
    }
  ],
  "totalCount": 1
}
```

#### DELETE /registered-faces/:identifier
Delete a registered face.

**Response:**
```json
{
  "success": true,
  "message": "Face deleted successfully",
  "totalCount": 0
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "registeredFaces": 5
}
```

## Usage Examples

### Using curl:

```bash
# Verify signature
curl -X POST http://localhost:3000/verify-signature \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","signature":"0x...","address":"0x..."}'

# Look up ENS name
curl http://localhost:3000/ens-lookup/0x1234...

# Reverse ENS lookup
curl http://localhost:3000/reverse-ens/vitalik.eth

# Upload image to Akave O3
curl -X POST http://localhost:3000/upload-image \
  -F "image=@/path/to/your/image.jpg" \
  -F "bucket=my-images"

# Detect faces in image
curl -X POST http://localhost:3000/detect-faces \
  -F "image=@/path/to/your/image.jpg"

# Register a face
curl -X POST http://localhost:3000/register-face \
  -F "image=@/path/to/your/image.jpg" \
  -F "identifier=john_doe"

# Recognize a face
curl -X POST http://localhost:3000/recognize-face \
  -F "image=@/path/to/your/image.jpg"

# Get all registered faces
curl http://localhost:3000/registered-faces

# Delete a registered face
curl -X DELETE http://localhost:3000/registered-faces/john_doe
```

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Akave O3 Configuration
AKAVE_ENDPOINT=https://o3.akave.xyz
AKAVE_ACCESS_KEY_ID=your-access-key-here
AKAVE_SECRET_ACCESS_KEY=your-secret-access-key

# Server Configuration (optional)
PORT=3000
```

### Akave O3 Setup

1. Visit the [Akave O3 documentation](https://docs.akave.xyz/akave-o3/) to get your access credentials
2. Set up your environment variables with your Akave O3 credentials
3. The server will automatically use the Akave O3 endpoint for image uploads

The server uses a public Ethereum RPC endpoint by default. You can modify the provider URL in `server.js` if you need to use a different network or RPC provider.

## Face Recognition Notes

**Important:** The current implementation uses simplified face recognition algorithms for demonstration purposes. In a production environment, you should:

1. **Use proper face recognition libraries** like:
   - OpenCV with DNN modules
   - face-api.js with proper model loading
   - TensorFlow.js with face recognition models

2. **Implement proper face descriptors** using:
   - Deep learning models (FaceNet, ArcFace, etc.)
   - Proper distance metrics (cosine similarity, Euclidean distance)

3. **Add security measures**:
   - Rate limiting for API endpoints
   - Input validation and sanitization
   - Secure storage of face data

4. **Consider privacy and compliance**:
   - GDPR compliance for face data
   - Data encryption at rest
   - User consent mechanisms

## Dependencies

- **express**: Web framework
- **ethers**: Ethereum library for signature verification and ENS operations
- **cors**: Cross-origin resource sharing middleware
- **@aws-sdk/client-s3**: AWS SDK for S3-compatible operations with Akave O3
- **multer**: Middleware for handling multipart/form-data (file uploads)
- **sharp**: High-performance image processing library for optimization
- **face-api.js**: Face recognition library (for future enhancement)
- **canvas**: Canvas API for Node.js (for image processing)
- **node-fetch**: HTTP client for external requests
