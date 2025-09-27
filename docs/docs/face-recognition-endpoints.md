# Face Recognition Endpoints

Detailed documentation for face detection and recognition capabilities using computer vision and machine learning.

## Face Detection

### POST /detect-faces

Detect faces in an uploaded image using computer vision algorithms.

#### Request

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file, required): Image file to analyze

#### Response

**Success (200):**
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

**Error (400):**
```json
{
  "error": "No image file provided"
}
```

**Error (500):**
```json
{
  "error": "Failed to detect faces",
  "details": "Image processing error"
}
```

#### Example Usage

```bash
# Detect faces in image
curl -X POST http://localhost:3000/detect-faces \
  -F "image=@/path/to/your/image.jpg"
```

#### JavaScript Example

```javascript
const detectFaces = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('http://localhost:3000/detect-faces', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

// Usage
const fileInput = document.getElementById('imageInput');
const imageFile = fileInput.files[0];

detectFaces(imageFile).then(result => {
  console.log(`Detected ${result.faceCount} faces`);
});
```

## Face Registration

### POST /register-face

Register a face for future recognition using a unique identifier.

#### Request

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file, required): Image file containing the face to register
- `identifier` (string, required): Unique identifier for the face

#### Response

**Success (200):**
```json
{
  "success": true,
  "identifier": "john_doe",
  "totalFaces": 5,
  "message": "Face registered successfully"
}
```

**Error (400):**
```json
{
  "error": "No image file provided"
}
```

**Error (400):**
```json
{
  "error": "Identifier is required"
}
```

**Error (400):**
```json
{
  "error": "Identifier already exists"
}
```

#### Example Usage

```bash
# Register a face
curl -X POST http://localhost:3000/register-face \
  -F "image=@/path/to/face.jpg" \
  -F "identifier=john_doe"
```

#### JavaScript Example

```javascript
const registerFace = async (imageFile, identifier) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('identifier', identifier);

  const response = await fetch('http://localhost:3000/register-face', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

// Usage
const registerUserFace = async (userId, imageFile) => {
  const result = await registerFace(imageFile, `user_${userId}`);
  
  if (result.success) {
    console.log(`Face registered for user ${userId}`);
  }
};
```

## Face Recognition

### POST /recognize-face

Recognize a face from an uploaded image by comparing against registered faces.

#### Request

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file, required): Image file to analyze

#### Response

**Success with Match (200):**
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

**Success with No Match (200):**
```json
{
  "success": true,
  "match": null,
  "message": "No matching face found"
}
```

**Error (400):**
```json
{
  "error": "No faces registered yet"
}
```

#### Example Usage

```bash
# Recognize a face
curl -X POST http://localhost:3000/recognize-face \
  -F "image=@/path/to/face.jpg"
```

#### JavaScript Example

```javascript
const recognizeFace = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('http://localhost:3000/recognize-face', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

// Usage
const authenticateUser = async (imageFile) => {
  const result = await recognizeFace(imageFile);
  
  if (result.match) {
    console.log(`User recognized: ${result.match.identifier}`);
    console.log(`Confidence: ${result.match.confidence}`);
  } else {
    console.log('No matching face found');
  }
};
```

## Face Management

### GET /registered-faces

Get all registered faces with their metadata.

#### Response

**Success (200):**
```json
{
  "success": true,
  "faces": [
    {
      "identifier": "john_doe",
      "registeredAt": "2024-01-01T00:00:00.000Z",
      "imageSize": 245760
    },
    {
      "identifier": "jane_smith",
      "registeredAt": "2024-01-02T00:00:00.000Z",
      "imageSize": 198432
    }
  ],
  "totalCount": 2
}
```

#### Example Usage

```bash
# List all registered faces
curl http://localhost:3000/registered-faces
```

#### JavaScript Example

```javascript
const getRegisteredFaces = async () => {
  const response = await fetch('http://localhost:3000/registered-faces');
  const result = await response.json();
  return result;
};

// Usage
getRegisteredFaces().then(result => {
  console.log(`Total registered faces: ${result.totalCount}`);
  result.faces.forEach(face => {
    console.log(`- ${face.identifier} (registered: ${face.registeredAt})`);
  });
});
```

### DELETE /registered-faces/:identifier

Delete a registered face by its identifier.

#### Request

**URL:** `DELETE /registered-faces/{identifier}`

**Parameters:**
- `identifier` (string, required): Identifier of the face to delete

#### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Face deleted successfully",
  "totalCount": 1
}
```

**Error (404):**
```json
{
  "error": "Face not found"
}
```

#### Example Usage

```bash
# Delete a registered face
curl -X DELETE http://localhost:3000/registered-faces/john_doe
```

#### JavaScript Example

```javascript
const deleteFace = async (identifier) => {
  const response = await fetch(`http://localhost:3000/registered-faces/${identifier}`, {
    method: 'DELETE'
  });

  const result = await response.json();
  return result;
};

// Usage
const removeUserFace = async (userId) => {
  const result = await deleteFace(`user_${userId}`);
  
  if (result.success) {
    console.log(`Face deleted for user ${userId}`);
  }
};
```

## Implementation Details

### Face Detection Algorithm

The current implementation uses a simplified face detection approach:

```javascript
async function detectFacesBasic(canvas) {
  // Simplified face detection - in production, use a proper face detection library
  // This is a placeholder that returns a random number of faces
  return Math.floor(Math.random() * 3) + 1;
}
```

**Note**: For production use, implement proper face detection using:
- OpenCV with DNN modules
- face-api.js with proper model loading
- TensorFlow.js with face recognition models

### Face Descriptor Generation

```javascript
async function generateFaceDescriptor(imageBuffer) {
  // Simplified face descriptor generation
  // In production, use a proper face recognition library
  const hash = require('crypto').createHash('md5').update(imageBuffer).digest('hex');
  return hash.substring(0, 32); // Return first 32 characters as descriptor
}
```

**Note**: For production use, implement proper face descriptors using:
- Deep learning models (FaceNet, ArcFace, etc.)
- Proper distance metrics (cosine similarity, Euclidean distance)

### Face Matching Algorithm

```javascript
function findBestMatch(descriptor) {
  let bestMatch = null;
  let bestScore = 0;
  const threshold = 0.7; // Minimum confidence threshold

  for (const face of registeredFaces) {
    const similarity = calculateSimilarity(descriptor, face.descriptor);
    
    if (similarity > threshold && similarity > bestScore) {
      bestScore = similarity;
      bestMatch = {
        identifier: face.identifier,
        confidence: similarity,
        registeredAt: face.registeredAt
      };
    }
  }

  return bestMatch;
}
```

### Image Processing Pipeline

1. **Upload**: Receive image file via multipart form data
2. **Validation**: Check file type and size
3. **Processing**: Resize and optimize image
4. **Analysis**: Extract face features
5. **Storage**: Store face descriptor and metadata

## Performance Considerations

### Image Processing

- **Resizing**: Images are resized to 400x400 pixels for face recognition
- **Format Standardization**: All images converted to JPEG
- **Quality Optimization**: 85% JPEG quality for optimal processing

### Memory Management

- **Temporary Files**: Images are processed in memory when possible
- **Cleanup**: Temporary files are automatically deleted
- **Streaming**: Large files are processed in chunks

### Recognition Speed

- **Descriptor Caching**: Face descriptors are cached in memory
- **Batch Processing**: Multiple faces can be processed simultaneously
- **Optimized Algorithms**: Efficient similarity calculations

## Security Considerations

### Privacy Protection

- **Data Encryption**: Consider encrypting face descriptors
- **Access Control**: Implement authentication for face management
- **Data Retention**: Set up automatic cleanup of old face data

### Compliance

- **GDPR**: Ensure compliance with data protection regulations
- **User Consent**: Implement proper consent mechanisms
- **Data Portability**: Allow users to export their face data

## Common Use Cases

### 1. User Authentication

```javascript
const authenticateWithFace = async (imageFile) => {
  const result = await recognizeFace(imageFile);
  
  if (result.match && result.match.confidence > 0.8) {
    // User authenticated successfully
    return { authenticated: true, userId: result.match.identifier };
  } else {
    // Authentication failed
    return { authenticated: false };
  }
};
```

### 2. Access Control

```javascript
const checkAccess = async (imageFile, requiredIdentifier) => {
  const result = await recognizeFace(imageFile);
  
  if (result.match && result.match.identifier === requiredIdentifier) {
    return { access: true, confidence: result.match.confidence };
  } else {
    return { access: false };
  }
};
```

### 3. Attendance System

```javascript
const markAttendance = async (imageFile, eventId) => {
  const result = await recognizeFace(imageFile);
  
  if (result.match) {
    // Record attendance
    await recordAttendance(eventId, result.match.identifier);
    return { success: true, user: result.match.identifier };
  } else {
    return { success: false, error: 'Face not recognized' };
  }
};
```

## Next Steps

- [Usage Examples](./usage-examples.md) - Practical examples
- [Curl Examples](./curl-examples.md) - Command-line examples
- [JavaScript Examples](./javascript-examples.md) - JavaScript integration
- [Face Recognition Guide](./face-recognition-guide.md) - Advanced face recognition techniques
