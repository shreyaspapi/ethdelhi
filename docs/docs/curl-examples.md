# Curl Examples

Command-line examples for testing the Ethereum Server API using curl.

## Basic Examples

### Health Check

```bash
# Check server health
curl http://localhost:3000/health
```

### API Documentation

```bash
# Get API documentation
curl http://localhost:3000/
```

## Ethereum Endpoints

### Verify Signature

```bash
# Verify Ethereum signature
curl -X POST http://localhost:3000/verify-signature \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello World",
    "signature": "0x1234567890abcdef...",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

### ENS Lookup

```bash
# Look up ENS name for address
curl http://localhost:3000/ens-lookup/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### Reverse ENS Lookup

```bash
# Resolve ENS name to address
curl http://localhost:3000/reverse-ens/vitalik.eth
```

## Image Storage

### Upload Image

```bash
# Upload image to default bucket
curl -X POST http://localhost:3000/upload-image \
  -F "image=@/path/to/image.jpg"

# Upload image to custom bucket
curl -X POST http://localhost:3000/upload-image \
  -F "image=@/path/to/image.jpg" \
  -F "bucket=my-images"
```

## Face Recognition

### Detect Faces

```bash
# Detect faces in image
curl -X POST http://localhost:3000/detect-faces \
  -F "image=@/path/to/image.jpg"
```

### Register Face

```bash
# Register a face
curl -X POST http://localhost:3000/register-face \
  -F "image=@/path/to/face.jpg" \
  -F "identifier=john_doe"
```

### Recognize Face

```bash
# Recognize a face
curl -X POST http://localhost:3000/recognize-face \
  -F "image=@/path/to/face.jpg"
```

### List Registered Faces

```bash
# Get all registered faces
curl http://localhost:3000/registered-faces
```

### Delete Face

```bash
# Delete a registered face
curl -X DELETE http://localhost:3000/registered-faces/john_doe
```

## Advanced Examples

### Batch Operations

```bash
# Upload multiple images
for file in *.jpg; do
  curl -X POST http://localhost:3000/upload-image \
    -F "image=@$file" \
    -F "bucket=my-gallery"
done
```

### Error Handling

```bash
# Test error responses
curl -X POST http://localhost:3000/verify-signature \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' \
  -w "HTTP Status: %{http_code}\n"
```

### Verbose Output

```bash
# Get detailed response information
curl -v -X POST http://localhost:3000/upload-image \
  -F "image=@image.jpg"
```

## Testing Scripts

### Complete Test Suite

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "Testing Ethereum Server API..."

# Health check
echo "1. Health check..."
curl -s "$BASE_URL/health" | jq '.'

# Test signature verification
echo "2. Testing signature verification..."
curl -s -X POST "$BASE_URL/verify-signature" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","signature":"0x123","address":"0x456"}' | jq '.'

# Test ENS lookup
echo "3. Testing ENS lookup..."
curl -s "$BASE_URL/ens-lookup/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" | jq '.'

# Test image upload
echo "4. Testing image upload..."
curl -s -X POST "$BASE_URL/upload-image" \
  -F "image=@test-image.jpg" | jq '.'

echo "Testing complete!"
```

### Performance Testing

```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/upload-image \
    -F "image=@test-image.jpg" &
done
wait
```

## Troubleshooting

### Common Issues

```bash
# Check if server is running
curl -I http://localhost:3000/health

# Test with timeout
curl --max-time 10 http://localhost:3000/health

# Test with retries
curl --retry 3 http://localhost:3000/health
```

### Debug Mode

```bash
# Enable debug output
curl -v -X POST http://localhost:3000/upload-image \
  -F "image=@image.jpg" \
  -H "Accept: application/json"
```
