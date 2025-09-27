# API Reference

Complete reference for all API endpoints in the Ethereum Server API.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the API does not require authentication. For production use, consider implementing API keys or JWT authentication.

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Error responses:

```json
{
  "error": "Error description",
  "details": "Additional error information"
}
```

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API documentation |
| `GET` | `/health` | Health check |
| `POST` | `/verify-signature` | Verify Ethereum signature |
| `GET` | `/ens-lookup/:address` | Look up ENS name |
| `GET` | `/reverse-ens/:ensName` | Resolve ENS name |
| `POST` | `/upload-image` | Upload image to Akave O3 |
| `POST` | `/detect-faces` | Detect faces in image |
| `POST` | `/register-face` | Register face for recognition |
| `POST` | `/recognize-face` | Recognize face from image |
| `GET` | `/registered-faces` | List registered faces |
| `DELETE` | `/registered-faces/:identifier` | Delete registered face |

## Health Check

### GET /health

Check server health and status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "registeredFaces": 5
}
```

## Ethereum Endpoints

### POST /verify-signature

Verify an Ethereum signature against a message and address.

**Request Body:**
```json
{
  "message": "Hello World",
  "signature": "0x1234...",
  "address": "0x5678..."
}
```

**Response:**
```json
{
  "isValid": true,
  "recoveredAddress": "0x5678...",
  "providedAddress": "0x5678...",
  "message": "Signature verification completed"
}
```

**Error Response:**
```json
{
  "error": "Missing required fields: message, signature, address"
}
```

### GET /ens-lookup/:address

Look up the ENS name for a given Ethereum address.

**Parameters:**
- `address` (string): Ethereum address to look up

**Example:** `GET /ens-lookup/0x1234...`

**Response:**
```json
{
  "address": "0x1234...",
  "ensName": "vitalik.eth",
  "hasEnsName": true
}
```

**Error Response:**
```json
{
  "error": "Invalid Ethereum address format"
}
```

### GET /reverse-ens/:ensName

Resolve an ENS name to its Ethereum address.

**Parameters:**
- `ensName` (string): ENS name to resolve

**Example:** `GET /reverse-ens/vitalik.eth`

**Response:**
```json
{
  "ensName": "vitalik.eth",
  "address": "0x1234...",
  "isResolved": true
}
```

**Error Response:**
```json
{
  "error": "ENS name not found or not resolvable"
}
```

## Image Storage Endpoints

### POST /upload-image

Upload an image to Akave O3 decentralized storage.

**Request:** `multipart/form-data`
- `image` (file): Image file to upload
- `bucket` (string, optional): Bucket name (default: "default-images")

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

**Error Response:**
```json
{
  "error": "No image file provided"
}
```

## Face Recognition Endpoints

### POST /detect-faces

Detect faces in an uploaded image.

**Request:** `multipart/form-data`
- `image` (file): Image file to analyze

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

**Error Response:**
```json
{
  "error": "No image file provided"
}
```

### POST /register-face

Register a face for recognition.

**Request:** `multipart/form-data`
- `image` (file): Image file containing the face
- `identifier` (string): Unique identifier for the face

**Response:**
```json
{
  "success": true,
  "identifier": "john_doe",
  "totalFaces": 5,
  "message": "Face registered successfully"
}
```

**Error Response:**
```json
{
  "error": "Identifier is required"
}
```

### POST /recognize-face

Recognize a face from an uploaded image.

**Request:** `multipart/form-data`
- `image` (file): Image file to analyze

**Response (Match Found):**
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

**Response (No Match):**
```json
{
  "success": true,
  "match": null,
  "message": "No matching face found"
}
```

**Error Response:**
```json
{
  "error": "No faces registered yet"
}
```

### GET /registered-faces

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

### DELETE /registered-faces/:identifier

Delete a registered face.

**Parameters:**
- `identifier` (string): Identifier of the face to delete

**Response:**
```json
{
  "success": true,
  "message": "Face deleted successfully",
  "totalCount": 0
}
```

**Error Response:**
```json
{
  "error": "Face not found"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid input |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error - Server error |

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider adding rate limiting middleware.

## File Upload Limits

- **Maximum file size**: 10MB
- **Supported formats**: All image formats (JPEG, PNG, GIF, WebP, BMP, TIFF)
- **Processing**: Automatic resizing and optimization

## Next Steps

- [Ethereum Endpoints](./ethereum-endpoints.md) - Detailed Ethereum API documentation
- [Image Storage Endpoints](./image-storage-endpoints.md) - Image upload and storage
- [Face Recognition Endpoints](./face-recognition-endpoints.md) - Face detection and recognition
- [Usage Examples](./usage-examples.md) - Practical examples
