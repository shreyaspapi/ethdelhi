# Face Recognition Endpoints

Detailed documentation for face detection and recognition capabilities with ENS domain integration using computer vision and machine learning.

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

## Face Registration with ENS Domain

### POST /register-face

Register a face for future recognition linked to an ENS domain. Requires cryptographic proof of ENS domain ownership.

#### Request

**Content-Type:** `multipart/form-data`

**Form Data:**
- `image` (file, required): Image file containing the face to register
- `ensDomain` (string, required): ENS domain name (e.g., "alice.eth")
- `signature` (string, required): Ethereum signature proving domain ownership
- `message` (string, required): The message that was signed

#### Response

**Success (200):**
```json
{
  "success": true,
  "ensDomain": "alice.eth",
  "ownerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "totalFaces": 5,
  "message": "Face registered successfully with ENS domain"
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
  "error": "ENS domain, signature, and message are required"
}
```

**Error (400):**
```json
{
  "error": "Invalid ENS domain ownership verification",
  "details": "Signature does not match ENS domain owner"
}
```

**Error (400):**
```json
{
  "error": "ENS domain already registered"
}
```

#### Example Usage

```bash
# Register a face with ENS domain
curl -X POST http://localhost:3000/register-face \
  -F "image=@/path/to/face.jpg" \
  -F "ensDomain=alice.eth" \
  -F "signature=0x1234567890abcdef..." \
  -F "message=Link face to alice.eth"
```

#### JavaScript Example

```javascript
const registerFaceWithENS = async (imageFile, ensDomain, signature, message) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('ensDomain', ensDomain);
  formData.append('signature', signature);
  formData.append('message', message);

  const response = await fetch('http://localhost:3000/register-face', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
};

// Usage with MetaMask signature
const registerUserFaceWithENS = async (imageFile, ensDomain) => {
  // Get user to sign a message proving ENS ownership
  const message = `Link face to ${ensDomain}`;
  const signature = await ethereum.request({
    method: 'personal_sign',
    params: [message, ethereum.selectedAddress]
  });
  
  const result = await registerFaceWithENS(imageFile, ensDomain, signature, message);
  
  if (result.success) {
    console.log(`Face registered for ENS domain ${ensDomain}`);
    console.log(`Owner address: ${result.ownerAddress}`);
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
    "ensDomain": "alice.eth",
    "ownerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
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
    console.log(`User recognized: ${result.match.ensDomain}`);
    console.log(`Owner address: ${result.match.ownerAddress}`);
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
      "ensDomain": "alice.eth",
      "ownerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "registeredAt": "2024-01-01T00:00:00.000Z",
      "imageSize": 245760
    },
    {
      "ensDomain": "bob.eth",
      "ownerAddress": "0x8ba1f109551bD432803012645Hac136c",
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
    console.log(`- ${face.ensDomain} (owner: ${face.ownerAddress}, registered: ${face.registeredAt})`);
  });
});
```

### GET /face-by-ens/:ensDomain

Get face information by ENS domain.

#### Request

**URL:** `GET /face-by-ens/{ensDomain}`

**Parameters:**
- `ensDomain` (string, required): ENS domain to look up

#### Response

**Success (200):**
```json
{
  "success": true,
  "face": {
    "ensDomain": "alice.eth",
    "ownerAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "registeredAt": "2024-01-01T00:00:00.000Z",
    "imageSize": 245760
  }
}
```

**Error (404):**
```json
{
  "error": "Face not found for ENS domain"
}
```

#### Example Usage

```bash
# Get face by ENS domain
curl http://localhost:3000/face-by-ens/alice.eth
```

#### JavaScript Example

```javascript
const getFaceByENS = async (ensDomain) => {
  const response = await fetch(`http://localhost:3000/face-by-ens/${ensDomain}`);
  const result = await response.json();
  return result;
};

// Usage
const checkUserFace = async (ensDomain) => {
  const result = await getFaceByENS(ensDomain);
  
  if (result.success) {
    console.log(`Face found for ${result.face.ensDomain}`);
    console.log(`Owner: ${result.face.ownerAddress}`);
  } else {
    console.log(`No face registered for ${ensDomain}`);
  }
};
```

### DELETE /registered-faces/:ensDomain

Delete a registered face by ENS domain.

#### Request

**URL:** `DELETE /registered-faces/{ensDomain}`

**Parameters:**
- `ensDomain` (string, required): ENS domain of the face to delete

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
  "error": "Face not found for ENS domain"
}
```

#### Example Usage

```bash
# Delete a registered face by ENS domain
curl -X DELETE http://localhost:3000/registered-faces/alice.eth
```

#### JavaScript Example

```javascript
const deleteFaceByENS = async (ensDomain) => {
  const response = await fetch(`http://localhost:3000/registered-faces/${ensDomain}`, {
    method: 'DELETE'
  });

  const result = await response.json();
  return result;
};

// Usage
const removeUserFaceByENS = async (ensDomain) => {
  const result = await deleteFaceByENS(ensDomain);
  
  if (result.success) {
    console.log(`Face deleted for ENS domain ${ensDomain}`);
  }
};
```

## Implementation Details

### ENS Domain Verification

The face registration process includes cryptographic verification of ENS domain ownership:

```javascript
async function verifyENSOwnership(ensDomain, signature, message) {
  try {
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Resolve ENS domain to address
    const domainAddress = await resolveAddress(ensDomain);
    
    if (!domainAddress) {
      return {
        isValid: false,
        error: 'ENS domain not found or not resolvable'
      };
    }
    
    // Check if the recovered address matches the ENS domain address
    const isOwner = recoveredAddress.toLowerCase() === domainAddress.toLowerCase();
    
    return {
      isValid: isOwner,
      address: recoveredAddress,
      domainAddress: domainAddress,
      error: isOwner ? null : 'Signature does not match ENS domain owner'
    };
    
  } catch (error) {
    console.error('ENS ownership verification error:', error);
    return {
      isValid: false,
      error: 'Failed to verify ENS ownership: ' + error.message
    };
  }
}
```

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
        ensDomain: face.ensDomain,
        ownerAddress: face.ownerAddress,
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

### 1. User Authentication with ENS Identity

```javascript
const authenticateWithFaceAndENS = async (imageFile) => {
  const result = await recognizeFace(imageFile);
  
  if (result.match && result.match.confidence > 0.8) {
    // User authenticated successfully with ENS domain
    return { 
      authenticated: true, 
      ensDomain: result.match.ensDomain,
      ownerAddress: result.match.ownerAddress 
    };
  } else {
    // Authentication failed
    return { authenticated: false };
  }
};
```

### 2. Access Control with ENS Domain

```javascript
const checkAccessWithENS = async (imageFile, requiredEnsDomain) => {
  const result = await recognizeFace(imageFile);
  
  if (result.match && result.match.ensDomain === requiredEnsDomain) {
    return { 
      access: true, 
      confidence: result.match.confidence,
      ownerAddress: result.match.ownerAddress 
    };
  } else {
    return { access: false };
  }
};
```

### 3. Attendance System with ENS Identity

```javascript
const markAttendanceWithENS = async (imageFile, eventId) => {
  const result = await recognizeFace(imageFile);
  
  if (result.match) {
    // Record attendance with ENS domain
    await recordAttendance(eventId, result.match.ensDomain, result.match.ownerAddress);
    return { 
      success: true, 
      ensDomain: result.match.ensDomain,
      ownerAddress: result.match.ownerAddress 
    };
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
