# Image Storage Endpoints

Detailed documentation for image upload and storage using Akave O3 decentralized storage.

## Image Upload

### POST /upload-image

Upload an image to Akave O3 decentralized storage with automatic optimization and processing.

#### Request

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file, required): Image file to upload
- `bucket` (string, optional): Bucket name (default: "default-images")

#### Supported File Types

- JPEG/JPG
- PNG
- GIF
- WebP
- BMP
- TIFF

#### File Size Limits

- **Maximum file size**: 10MB
- **Automatic optimization**: Images are resized and optimized

#### Response

**Success (200):**
```json
{
  "success": true,
  "fileName": "images/1704067200000-abc123def456.jpg",
  "bucket": "default-images",
  "url": "https://o3.akave.xyz/default-images/images/1704067200000-abc123def456.jpg",
  "size": 245760,
  "originalSize": 512000,
  "etag": "\"abc123def456\"",
  "message": "Image uploaded successfully to Akave O3"
}
```

**Error (400):**
```json
{
  "error": "No image file provided"
}
```

**Error (500):**
```json
{
  "error": "Failed to upload image",
  "details": "Akave O3 connection failed"
}
```

#### Example Usage

```bash
# Upload image to default bucket
curl -X POST http://localhost:3000/upload-image \
  -F "image=@/path/to/your/image.jpg"

# Upload image to custom bucket
curl -X POST http://localhost:3000/upload-image \
  -F "image=@/path/to/your/image.jpg" \
  -F "bucket=my-custom-bucket"
```

#### JavaScript Example

```javascript
// Upload image using FormData
const uploadImage = async (imageFile, bucket = 'default-images') => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('bucket', bucket);

  const response = await fetch('http://localhost:3000/upload-image', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

// Usage
const fileInput = document.getElementById('imageInput');
const imageFile = fileInput.files[0];

uploadImage(imageFile, 'my-bucket').then(result => {
  console.log('Image uploaded:', result.url);
});
```

## Image Processing

### Automatic Optimization

The server automatically processes uploaded images:

1. **Resizing**: Images are resized to fit within 1920x1080 pixels
2. **Format Conversion**: All images are converted to JPEG format
3. **Quality Optimization**: JPEG quality set to 85% for optimal size/quality balance
4. **Aspect Ratio**: Maintains original aspect ratio

### Processing Pipeline

```javascript
const processedImageBuffer = await sharp(file.buffer)
  .resize(1920, 1080, { 
    fit: 'inside',
    withoutEnlargement: true 
  })
  .jpeg({ quality: 85 })
  .toBuffer();
```

### File Naming

Uploaded files are automatically named using:
- **Timestamp**: Current timestamp in milliseconds
- **Random String**: 13-character random string
- **Original Extension**: Preserved from original file

Format: `images/{timestamp}-{randomString}.{extension}`

Example: `images/1704067200000-abc123def456.jpg`

## Akave O3 Configuration

### Environment Variables

```env
AKAVE_ENDPOINT=https://o3.akave.xyz
AKAVE_ACCESS_KEY_ID=your-access-key-here
AKAVE_SECRET_ACCESS_KEY=your-secret-access-key
```

### S3-Compatible API

The server uses the AWS S3 SDK with Akave O3's S3-compatible interface:

```javascript
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.AKAVE_ENDPOINT || 'https://o3.akave.xyz',
  credentials: {
    accessKeyId: process.env.AKAVE_ACCESS_KEY_ID,
    secretAccessKey: process.env.AKAVE_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});
```

## Public URLs

### URL Structure

Uploaded images are accessible via public URLs:

```
https://o3.akave.xyz/{bucket}/{fileName}
```

Example:
```
https://o3.akave.xyz/default-images/images/1704067200000-abc123def456.jpg
```

### URL Generation

The server automatically generates public URLs for uploaded images:

```javascript
const publicUrl = `${process.env.AKAVE_ENDPOINT || 'https://o3.akave.xyz'}/${bucket}/${fileName}`;
```

## Error Handling

### Common Errors

#### File Too Large
```json
{
  "error": "File too large",
  "details": "Maximum file size is 10MB"
}
```

#### Invalid File Type
```json
{
  "error": "Only image files are allowed"
}
```

#### Akave O3 Connection Error
```json
{
  "error": "Failed to upload image",
  "details": "Akave O3 connection failed"
}
```

#### Missing File
```json
{
  "error": "No image file provided"
}
```

### Error Prevention

1. **File Type Validation**: Only image files are accepted
2. **Size Limits**: 10MB maximum file size
3. **Format Validation**: Server-side validation of file headers
4. **Connection Retry**: Automatic retry for network issues

## Performance Considerations

### Image Optimization

- **Sharp Library**: High-performance image processing
- **Memory Efficiency**: Stream-based processing
- **Automatic Resizing**: Prevents oversized images
- **Format Standardization**: Consistent JPEG output

### Upload Performance

- **Concurrent Uploads**: Multiple files can be uploaded simultaneously
- **Memory Management**: Efficient memory usage for large files
- **Progress Tracking**: Real-time upload progress (client-side)

## Security Considerations

### File Validation

- **MIME Type Checking**: Server-side validation of file types
- **File Header Validation**: Verification of actual file content
- **Size Limits**: Prevention of oversized uploads
- **Path Traversal Protection**: Secure file naming

### Access Control

- **Public URLs**: All uploaded images are publicly accessible
- **Bucket Isolation**: Different buckets for different use cases
- **No Authentication**: Currently no access control (consider for production)

## Common Use Cases

### 1. Profile Picture Upload

```javascript
const uploadProfilePicture = async (imageFile, userId) => {
  const result = await uploadImage(imageFile, `profile-pictures`);
  
  // Store the URL in your database
  await updateUserProfile(userId, { profilePictureUrl: result.url });
  
  return result.url;
};
```

### 2. Gallery Management

```javascript
const uploadToGallery = async (imageFile, galleryId) => {
  const result = await uploadImage(imageFile, `gallery-${galleryId}`);
  
  // Add to gallery in database
  await addToGallery(galleryId, {
    url: result.url,
    fileName: result.fileName,
    uploadedAt: new Date()
  });
  
  return result;
};
```

### 3. Batch Upload

```javascript
const uploadMultipleImages = async (imageFiles, bucket) => {
  const uploadPromises = imageFiles.map(file => uploadImage(file, bucket));
  const results = await Promise.all(uploadPromises);
  
  return results;
};
```

## Monitoring and Analytics

### Upload Metrics

Track upload performance and usage:

```javascript
// Log upload metrics
console.log({
  fileName: result.fileName,
  originalSize: result.originalSize,
  optimizedSize: result.size,
  compressionRatio: result.originalSize / result.size,
  uploadTime: Date.now() - startTime
});
```

### Error Tracking

Monitor upload failures and errors:

```javascript
// Track upload errors
if (!result.success) {
  console.error('Upload failed:', {
    error: result.error,
    fileName: file.name,
    fileSize: file.size,
    timestamp: new Date()
  });
}
```

## Next Steps

- [Face Recognition Endpoints](./face-recognition-endpoints.md) - Face detection and recognition
- [Usage Examples](./usage-examples.md) - Practical examples
- [Curl Examples](./curl-examples.md) - Command-line examples
- [JavaScript Examples](./javascript-examples.md) - JavaScript integration
