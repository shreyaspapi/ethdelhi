# Usage Examples

Practical examples demonstrating how to use the Ethereum Server API with ENS integration and face recognition in real-world scenarios.

## Quick Start Examples

### 1. Basic Health Check

```bash
# Check if the server is running
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "registeredFaces": 0
}
```

### 2. Verify Ethereum Signature

```bash
# Verify a signature
curl -X POST http://localhost:3000/verify-signature \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello World",
    "signature": "0x1234567890abcdef...",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

### 3. Upload Image to Akave O3

```bash
# Upload an image
curl -X POST http://localhost:3000/upload-image \
  -F "image=@/path/to/image.jpg" \
  -F "bucket=my-images"
```

### 4. Get ENS Information

```bash
# Get comprehensive ENS info
curl http://localhost:3000/ens-info/alice.eth

# Get ENS text record
curl http://localhost:3000/ens-text/alice.eth/description

# Get ENS content hash
curl http://localhost:3000/ens-contenthash/alice.eth
```

### 5. Register Face with ENS Domain

```bash
# Register face with ENS domain (requires signature)
curl -X POST http://localhost:3000/register-face \
  -F "image=@/path/to/face.jpg" \
  -F "ensDomain=alice.eth" \
  -F "signature=0x1234567890abcdef..." \
  -F "message=Link face to alice.eth"
```

## JavaScript Integration Examples

### 1. Complete API Client Class

```javascript
class EthereumServerAPI {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  // Health check
  async health() {
    const response = await fetch(`${this.baseUrl}/health`);
    return await response.json();
  }

  // Verify signature
  async verifySignature(message, signature, address) {
    const response = await fetch(`${this.baseUrl}/verify-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature, address })
    });
    return await response.json();
  }

  // ENS lookup
  async lookupENS(address) {
    const response = await fetch(`${this.baseUrl}/ens-lookup/${address}`);
    return await response.json();
  }

  // Reverse ENS lookup
  async resolveENS(ensName) {
    const response = await fetch(`${this.baseUrl}/reverse-ens/${ensName}`);
    return await response.json();
  }

  // ENS resolver info
  async getENSResolver(ensName) {
    const response = await fetch(`${this.baseUrl}/ens-resolver/${ensName}`);
    return await response.json();
  }

  // ENS text record
  async getENSTextRecord(ensName, key) {
    const response = await fetch(`${this.baseUrl}/ens-text/${ensName}/${key}`);
    return await response.json();
  }

  // ENS content hash
  async getENSContentHash(ensName) {
    const response = await fetch(`${this.baseUrl}/ens-contenthash/${ensName}`);
    return await response.json();
  }

  // Comprehensive ENS info
  async getENSInfo(ensName) {
    const response = await fetch(`${this.baseUrl}/ens-info/${ensName}`);
    return await response.json();
  }

  // Upload image
  async uploadImage(imageFile, bucket = 'default-images') {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('bucket', bucket);

    const response = await fetch(`${this.baseUrl}/upload-image`, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  }

  // Detect faces
  async detectFaces(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/detect-faces`, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  }

  // Register face with ENS domain
  async registerFaceWithENS(imageFile, ensDomain, signature, message) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('ensDomain', ensDomain);
    formData.append('signature', signature);
    formData.append('message', message);

    const response = await fetch(`${this.baseUrl}/register-face`, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  }

  // Get face by ENS domain
  async getFaceByENS(ensDomain) {
    const response = await fetch(`${this.baseUrl}/face-by-ens/${ensDomain}`);
    return await response.json();
  }

  // Recognize face
  async recognizeFace(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseUrl}/recognize-face`, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  }

  // Get registered faces
  async getRegisteredFaces() {
    const response = await fetch(`${this.baseUrl}/registered-faces`);
    return await response.json();
  }

  // Delete face by ENS domain
  async deleteFaceByENS(ensDomain) {
    const response = await fetch(`${this.baseUrl}/registered-faces/${ensDomain}`, {
      method: 'DELETE'
    });
    return await response.json();
  }
}

// Usage
const api = new EthereumServerAPI();

// Check server health
api.health().then(result => {
  console.log('Server status:', result.status);
});
```

### 2. ENS Integration System

```javascript
class ENSIntegration {
  constructor(api) {
    this.api = api;
  }

  // Get comprehensive ENS information
  async getENSProfile(ensName) {
    const info = await this.api.getENSInfo(ensName);
    
    if (info.hasAddress) {
      return {
        ensName: info.ensName,
        address: info.address,
        description: info.textRecords.description,
        website: info.textRecords.url,
        avatar: info.textRecords.avatar,
        twitter: info.textRecords.twitter,
        github: info.textRecords.github,
        contentHash: info.contentHash,
        hasResolver: info.hasResolver
      };
    } else {
      throw new Error(`ENS name ${ensName} not found or not resolvable`);
    }
  }

  // Check if ENS domain has face registered
  async hasFaceRegistered(ensName) {
    try {
      const face = await this.api.getFaceByENS(ensName);
      return face.success;
    } catch (error) {
      return false;
    }
  }

  // Register face with ENS domain (requires MetaMask)
  async registerFaceWithENS(ensName, imageFile) {
    // Get user to sign a message proving ENS ownership
    const message = `Link face to ${ensName}`;
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message, ethereum.selectedAddress]
    });
    
    const result = await this.api.registerFaceWithENS(imageFile, ensName, signature, message);
    
    if (result.success) {
      console.log(`Face registered for ENS domain ${ensName}`);
      console.log(`Owner address: ${result.ownerAddress}`);
      return { success: true, ensDomain: result.ensDomain, ownerAddress: result.ownerAddress };
    } else {
      throw new Error(`Face registration failed: ${result.error}`);
    }
  }

  // Authenticate with face and get ENS identity
  async authenticateWithFaceAndENS(imageFile) {
    const result = await this.api.recognizeFace(imageFile);
    
    if (result.match && result.match.confidence > 0.8) {
      return {
        authenticated: true,
        ensDomain: result.match.ensDomain,
        ownerAddress: result.match.ownerAddress,
        confidence: result.match.confidence
      };
    } else {
      return { authenticated: false, error: 'Face not recognized' };
    }
  }
}

// Usage
const ensIntegration = new ENSIntegration(api);

// Get ENS profile
const getENSProfile = async (ensName) => {
  try {
    const profile = await ensIntegration.getENSProfile(ensName);
    console.log(`ENS Profile for ${profile.ensName}:`);
    console.log(`Address: ${profile.address}`);
    console.log(`Description: ${profile.description || 'No description'}`);
    console.log(`Website: ${profile.website || 'No website'}`);
  } catch (error) {
    console.error('Error getting ENS profile:', error.message);
  }
};

// Register face with ENS
const registerFaceWithENS = async (ensName, imageFile) => {
  try {
    const result = await ensIntegration.registerFaceWithENS(ensName, imageFile);
    console.log(`Face registered for ${result.ensDomain}`);
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
};
```

### 3. Wallet Authentication System

```javascript
class WalletAuth {
  constructor(api) {
    this.api = api;
  }

  // Generate authentication message
  generateAuthMessage(userId, timestamp) {
    return `Sign this message to authenticate: ${userId} at ${timestamp}`;
  }

  // Authenticate user with signature
  async authenticateWithSignature(userId, signature, address) {
    const timestamp = Date.now();
    const message = this.generateAuthMessage(userId, timestamp);
    
    const result = await this.api.verifySignature(message, signature, address);
    
    if (result.isValid) {
      // Store authentication session
      localStorage.setItem('authSession', JSON.stringify({
        userId,
        address,
        timestamp,
        authenticated: true
      }));
      
      return { success: true, userId, address };
    } else {
      return { success: false, error: 'Invalid signature' };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const session = localStorage.getItem('authSession');
    if (!session) return false;
    
    const { timestamp } = JSON.parse(session);
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    return (now - timestamp) < sessionDuration;
  }

  // Get current user
  getCurrentUser() {
    const session = localStorage.getItem('authSession');
    if (!session) return null;
    
    return JSON.parse(session);
  }

  // Logout
  logout() {
    localStorage.removeItem('authSession');
  }
}

// Usage
const walletAuth = new WalletAuth(api);

// Authenticate user
const authenticateUser = async (userId, signature, address) => {
  const result = await walletAuth.authenticateWithSignature(userId, signature, address);
  
  if (result.success) {
    console.log('User authenticated:', result.userId);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } else {
    console.error('Authentication failed:', result.error);
  }
};
```

### 4. Face Recognition System with ENS Integration

```javascript
class FaceRecognitionSystem {
  constructor(api) {
    this.api = api;
  }

  // Register user face with ENS domain
  async registerUserFaceWithENS(ensDomain, imageFile, signature, message) {
    const result = await this.api.registerFaceWithENS(imageFile, ensDomain, signature, message);
    
    if (result.success) {
      console.log(`Face registered for ENS domain ${ensDomain}`);
      return { success: true, ensDomain: result.ensDomain, ownerAddress: result.ownerAddress };
    } else {
      console.error('Face registration failed:', result.error);
      return { success: false, error: result.error };
    }
  }

  // Authenticate with face and get ENS identity
  async authenticateWithFaceAndENS(imageFile) {
    const result = await this.api.recognizeFace(imageFile);
    
    if (result.match && result.match.confidence > 0.8) {
      return { 
        success: true, 
        ensDomain: result.match.ensDomain,
        ownerAddress: result.match.ownerAddress,
        confidence: result.match.confidence 
      };
    } else {
      return { 
        success: false, 
        error: 'Face not recognized' 
      };
    }
  }

  // Check if ENS domain has registered face
  async hasRegisteredFace(ensDomain) {
    try {
      const face = await this.api.getFaceByENS(ensDomain);
      return face.success;
    } catch (error) {
      return false;
    }
  }

  // Delete user face by ENS domain
  async deleteUserFaceByENS(ensDomain) {
    const result = await this.api.deleteFaceByENS(ensDomain);
    
    if (result.success) {
      console.log(`Face deleted for ENS domain ${ensDomain}`);
      return { success: true };
    } else {
      console.error('Face deletion failed:', result.error);
      return { success: false, error: result.error };
    }
  }
}

// Usage
const faceSystem = new FaceRecognitionSystem(api);

// Register user face with ENS domain
const registerFaceWithENS = async (ensDomain, imageFile, signature, message) => {
  const result = await faceSystem.registerUserFaceWithENS(ensDomain, imageFile, signature, message);
  
  if (result.success) {
    console.log(`Face registered for ENS domain ${result.ensDomain}`);
    console.log(`Owner address: ${result.ownerAddress}`);
  } else {
    console.error('Registration failed:', result.error);
  }
};

// Authenticate with face and get ENS identity
const authenticateWithFaceAndENS = async (imageFile) => {
  const result = await faceSystem.authenticateWithFaceAndENS(imageFile);
  
  if (result.success) {
    console.log(`User authenticated with ENS domain: ${result.ensDomain}`);
    console.log(`Owner address: ${result.ownerAddress}`);
    console.log(`Confidence: ${result.confidence}`);
  } else {
    console.error('Authentication failed:', result.error);
  }
};
```

## React Integration Examples

### 1. React Hook for API

```javascript
import { useState, useEffect } from 'react';

const useEthereumAPI = (baseUrl = 'http://localhost:3000') => {
  const [api] = useState(new EthereumServerAPI(baseUrl));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (apiCall) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { api, loading, error, execute };
};

// Usage in component
const MyComponent = () => {
  const { api, loading, error, execute } = useEthereumAPI();

  const handleVerifySignature = async (message, signature, address) => {
    try {
      const result = await execute(() => 
        api.verifySignature(message, signature, address)
      );
      console.log('Signature verification:', result);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {/* Your component content */}
    </div>
  );
};
```

### 2. Image Upload Component

```javascript
import React, { useState } from 'react';

const ImageUpload = ({ onUpload, bucket = 'default-images' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await api.uploadImage(file, bucket);
      onUpload(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
};

// Usage
const MyImageUploader = () => {
  const handleUpload = (result) => {
    console.log('Image uploaded:', result.url);
    // Handle successful upload
  };

  return (
    <ImageUpload 
      onUpload={handleUpload}
      bucket="my-images"
    />
  );
};
```

### 3. Face Recognition Component

```javascript
import React, { useState } from 'react';

const FaceRecognition = () => {
  const [recognizing, setRecognizing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFaceRecognition = async (imageFile) => {
    setRecognizing(true);
    setError(null);

    try {
      const result = await api.recognizeFace(imageFile);
      setResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setRecognizing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFaceRecognition(e.target.files[0])}
        disabled={recognizing}
      />
      
      {recognizing && <p>Recognizing face...</p>}
      
      {result && (
        <div>
          {result.match ? (
            <div>
              <p>Face recognized: {result.match.identifier}</p>
              <p>Confidence: {result.match.confidence}</p>
            </div>
          ) : (
            <p>No matching face found</p>
          )}
        </div>
      )}
      
      {error && <p>Error: {error}</p>}
    </div>
  );
};
```

## Node.js Server Integration

### 1. Express Middleware

```javascript
const express = require('express');
const { EthereumServerAPI } = require('./ethereum-server-api');

const app = express();
const api = new EthereumServerAPI('http://localhost:3000');

// Middleware to verify Ethereum signature
const verifySignature = async (req, res, next) => {
  const { message, signature, address } = req.body;
  
  try {
    const result = await api.verifySignature(message, signature, address);
    
    if (result.isValid) {
      req.user = { address, verified: true };
      next();
    } else {
      res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Signature verification failed' });
  }
};

// Protected route
app.post('/protected', verifySignature, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

app.listen(3001);
```

### 2. WebSocket Integration

```javascript
const WebSocket = require('ws');
const { EthereumServerAPI } = require('./ethereum-server-api');

const api = new EthereumServerAPI('http://localhost:3000');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    try {
      const { type, payload } = JSON.parse(data);
      
      switch (type) {
        case 'verify_signature':
          const result = await api.verifySignature(
            payload.message,
            payload.signature,
            payload.address
          );
          ws.send(JSON.stringify({ type: 'signature_result', result }));
          break;
          
        case 'recognize_face':
          const faceResult = await api.recognizeFace(payload.imageFile);
          ws.send(JSON.stringify({ type: 'face_result', result: faceResult }));
          break;
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });
});
```

## Error Handling Examples

### 1. Comprehensive Error Handling

```javascript
class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

const handleAPIError = (response) => {
  if (!response.ok) {
    throw new APIError(
      response.statusText,
      response.status,
      await response.json()
    );
  }
  return response.json();
};

// Usage with error handling
const safeAPI = {
  async verifySignature(message, signature, address) {
    try {
      const response = await fetch('http://localhost:3000/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, address })
      });
      
      return await handleAPIError(response);
    } catch (err) {
      if (err instanceof APIError) {
        console.error(`API Error ${err.status}: ${err.message}`);
        throw err;
      } else {
        console.error('Network error:', err.message);
        throw new Error('Network connection failed');
      }
    }
  }
};
```

### 2. Retry Logic

```javascript
const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

// Usage
const uploadImageWithRetry = async (imageFile, bucket) => {
  return await retry(async () => {
    return await api.uploadImage(imageFile, bucket);
  });
};
```

## Next Steps

- [Curl Examples](./curl-examples.md) - Command-line examples
- [JavaScript Examples](./javascript-examples.md) - JavaScript integration
- [Face Recognition Guide](./face-recognition-guide.md) - Advanced face recognition techniques
- [Security Considerations](./security-considerations.md) - Production security tips
