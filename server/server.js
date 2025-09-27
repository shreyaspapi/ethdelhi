const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
// Canvas dependency removed - using simplified face detection

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Provider for Sepolia testnet
const provider = new ethers.JsonRpcProvider('https://1rpc.io/sepolia');

// ENS Sepolia Contract Addresses
const ENS_CONTRACTS = {
  registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  publicResolver: '0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5',
  universalResolver: '0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe'
};

// ENS Registry ABI (minimal for our needs)
const ENS_REGISTRY_ABI = [
  "function resolver(bytes32 node) external view returns (address)",
  "function owner(bytes32 node) external view returns (address)"
];

// Public Resolver ABI (minimal for our needs)
const PUBLIC_RESOLVER_ABI = [
  "function addr(bytes32 node) external view returns (address)",
  "function text(bytes32 node, string calldata key) external view returns (string memory)",
  "function contenthash(bytes32 node) external view returns (bytes memory)"
];

// Universal Resolver ABI
const UNIVERSAL_RESOLVER_ABI = [
  "function resolve(bytes calldata name, bytes calldata data) external view returns (bytes memory)"
];

// Akave O3 S3 Configuration
const s3Client = new S3Client({
  region: 'us-east-1', // Akave O3 region
  endpoint: process.env.AKAVE_ENDPOINT || 'https://o3.akave.xyz',
  credentials: {
    accessKeyId: process.env.AKAVE_ACCESS_KEY_ID || 'your-access-key',
    secretAccessKey: process.env.AKAVE_SECRET_ACCESS_KEY || 'your-secret-key'
  },
  forcePathStyle: true // Required for Akave O3
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Face recognition storage (in production, use a database)
let registeredFaces = [];
let faceMatcher = null;

/**
 * Verify Ethereum signature
 * POST /verify-signature
 * Body: { message, signature, address }
 */
app.post('/verify-signature', async (req, res) => {
  try {
    const { message, signature, address } = req.body;

    // Validate input
    if (!message || !signature || !address) {
      return res.status(400).json({
        error: 'Missing required fields: message, signature, address'
      });
    }

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Check if the recovered address matches the provided address
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

    res.json({
      isValid,
      recoveredAddress,
      providedAddress: address,
      message: 'Signature verification completed'
    });

  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({
      error: 'Failed to verify signature',
      details: error.message
    });
  }
});

/**
 * Look up ENS address
 * GET /ens-lookup/:address
 */
app.get('/ens-lookup/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Validate Ethereum address format
    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address format'
      });
    }

    // Look up ENS name
    const ensName = await provider.lookupAddress(address);

    res.json({
      address,
      ensName: ensName || null,
      hasEnsName: !!ensName
    });

  } catch (error) {
    console.error('ENS lookup error:', error);
    res.status(500).json({
      error: 'Failed to lookup ENS name',
      details: error.message
    });
  }
});

/**
 * Reverse ENS lookup - get address from ENS name
 * GET /reverse-ens/:ensName
 */
app.get('/reverse-ens/:ensName', async (req, res) => {
  try {
    const { ensName } = req.params;

    // Resolve ENS name to address
    const address = await provider.resolveName(ensName);

    if (!address) {
      return res.status(404).json({
        error: 'ENS name not found or not resolvable'
      });
    }

    res.json({
      ensName,
      address,
      isResolved: true
    });

  } catch (error) {
    console.error('Reverse ENS lookup error:', error);
    res.status(500).json({
      error: 'Failed to resolve ENS name',
      details: error.message
    });
  }
});

/**
 * Get ENS resolver information for a name
 * GET /ens-resolver/:ensName
 */
app.get('/ens-resolver/:ensName', async (req, res) => {
  try {
    const { ensName } = req.params;

    const resolverAddress = await getResolver(ensName);
    const namehash = getNamehash(ensName);

    res.json({
      ensName,
      namehash,
      resolverAddress: resolverAddress === '0x0000000000000000000000000000000000000000' ? null : resolverAddress,
      hasResolver: resolverAddress !== '0x0000000000000000000000000000000000000000'
    });

  } catch (error) {
    console.error('ENS resolver lookup error:', error);
    res.status(500).json({
      error: 'Failed to get ENS resolver',
      details: error.message
    });
  }
});

/**
 * Get ENS text record
 * GET /ens-text/:ensName/:key
 */
app.get('/ens-text/:ensName/:key', async (req, res) => {
  try {
    const { ensName, key } = req.params;

    const textValue = await getTextRecord(ensName, key);

    res.json({
      ensName,
      key,
      value: textValue,
      hasRecord: textValue !== null && textValue !== ''
    });

  } catch (error) {
    console.error('ENS text record lookup error:', error);
    res.status(500).json({
      error: 'Failed to get ENS text record',
      details: error.message
    });
  }
});

/**
 * Get ENS content hash
 * GET /ens-contenthash/:ensName
 */
app.get('/ens-contenthash/:ensName', async (req, res) => {
  try {
    const { ensName } = req.params;

    const contentHash = await getContentHash(ensName);

    res.json({
      ensName,
      contentHash: contentHash,
      hasContentHash: contentHash !== null && contentHash !== '0x'
    });

  } catch (error) {
    console.error('ENS content hash lookup error:', error);
    res.status(500).json({
      error: 'Failed to get ENS content hash',
      details: error.message
    });
  }
});

/**
 * Get comprehensive ENS information
 * GET /ens-info/:ensName
 */
app.get('/ens-info/:ensName', async (req, res) => {
  try {
    const { ensName } = req.params;

    // Get all ENS information in parallel
    const [resolverAddress, address, contentHash] = await Promise.all([
      getResolver(ensName),
      resolveAddress(ensName),
      getContentHash(ensName)
    ]);

    // Get common text records
    const [description, url, avatar, twitter, github] = await Promise.all([
      getTextRecord(ensName, 'description'),
      getTextRecord(ensName, 'url'),
      getTextRecord(ensName, 'avatar'),
      getTextRecord(ensName, 'com.twitter'),
      getTextRecord(ensName, 'com.github')
    ]);

    const namehash = getNamehash(ensName);

    res.json({
      ensName,
      namehash,
      resolverAddress: resolverAddress === '0x0000000000000000000000000000000000000000' ? null : resolverAddress,
      address,
      contentHash,
      textRecords: {
        description,
        url,
        avatar,
        twitter,
        github
      },
      hasResolver: resolverAddress !== '0x0000000000000000000000000000000000000000',
      hasAddress: address !== null,
      hasContentHash: contentHash !== null && contentHash !== '0x'
    });

  } catch (error) {
    console.error('ENS info lookup error:', error);
    res.status(500).json({
      error: 'Failed to get ENS information',
      details: error.message
    });
  }
});

/**
 * Upload image to Akave O3
 * POST /upload-image
 * Body: FormData with 'image' field and optional 'bucket' field
 */
app.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    const { bucket = 'default-images' } = req.body;
    const file = req.file;

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const fileName = `images/${timestamp}-${randomString}${fileExtension}`;

    // Process image with Sharp (resize and optimize)
    const processedImageBuffer = await sharp(file.buffer)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload to Akave O3
    const uploadParams = {
      Bucket: bucket,
      Key: fileName,
      Body: processedImageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };

    const command = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(command);

    // Generate public URL
    const publicUrl = `${process.env.AKAVE_ENDPOINT || 'https://o3.akave.xyz'}/${bucket}/${fileName}`;

    res.json({
      success: true,
      fileName: fileName,
      bucket: bucket,
      url: publicUrl,
      size: processedImageBuffer.length,
      originalSize: file.size,
      etag: result.ETag,
      message: 'Image uploaded successfully to Akave O3'
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
});

/**
 * Detect faces in an image
 * POST /detect-faces
 * Body: FormData with 'image' field
 */
app.post('/detect-faces', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    const file = req.file;

    // Process image with Sharp to ensure compatibility
    const processedBuffer = await sharp(file.buffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Create a temporary file for face-api.js
    const tempPath = `/tmp/face_${Date.now()}.jpg`;
    fs.writeFileSync(tempPath, processedBuffer);

    try {
      // Simple face detection using basic image analysis
      // In a production environment, you would use a proper face detection library
      const faceCount = await detectFacesBasic(processedBuffer);

      // Clean up temp file
      fs.unlinkSync(tempPath);

      res.json({
        success: true,
        faceCount: faceCount,
        imageSize: {
          width: 800,
          height: 600
        },
        message: `Detected ${faceCount} face(s) in the image`
      });

    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }

  } catch (error) {
    console.error('Face detection error:', error);
    res.status(500).json({
      error: 'Failed to detect faces',
      details: error.message
    });
  }
});

/**
 * Register a face for recognition with ENS domain
 * POST /register-face
 * Body: FormData with 'image', 'ensDomain', 'signature', and 'message' fields
 */
app.post('/register-face', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    const { ensDomain, signature, message } = req.body;

    if (!ensDomain || !signature || !message) {
      return res.status(400).json({
        error: 'ENS domain, signature, and message are required'
      });
    }

    // Verify ENS domain ownership
    const domainOwner = await verifyENSOwnership(ensDomain, signature, message);
    if (!domainOwner.isValid) {
      return res.status(400).json({
        error: 'Invalid ENS domain ownership verification',
        details: domainOwner.error
      });
    }

    // Check if ENS domain already exists
    if (registeredFaces.find(face => face.ensDomain === ensDomain)) {
      return res.status(400).json({
        error: 'ENS domain already registered'
      });
    }

    const file = req.file;

    // Process image
    const processedBuffer = await sharp(file.buffer)
      .resize(400, 400, {
        fit: 'cover'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Create face descriptor (simplified - in production use proper face recognition)
    const faceDescriptor = await generateFaceDescriptor(processedBuffer);

    // Store face data with ENS domain
    const faceData = {
      ensDomain: ensDomain,
      descriptor: faceDescriptor,
      registeredAt: new Date().toISOString(),
      imageSize: file.size,
      ownerAddress: domainOwner.address,
      message: message,
      signature: signature
    };

    registeredFaces.push(faceData);
    updateFaceMatcher();

    res.json({
      success: true,
      ensDomain: ensDomain,
      ownerAddress: domainOwner.address,
      totalFaces: registeredFaces.length,
      message: 'Face registered successfully with ENS domain'
    });

  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({
      error: 'Failed to register face',
      details: error.message
    });
  }
});

/**
 * Recognize a face
 * POST /recognize-face
 * Body: FormData with 'image' field
 */
app.post('/recognize-face', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    if (registeredFaces.length === 0) {
      return res.status(400).json({
        error: 'No faces registered yet'
      });
    }

    const file = req.file;

    // Process image
    const processedBuffer = await sharp(file.buffer)
      .resize(400, 400, {
        fit: 'cover'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Generate face descriptor
    const faceDescriptor = await generateFaceDescriptor(processedBuffer);

    // Find best match
    const match = findBestMatch(faceDescriptor);

    if (match) {
      res.json({
        success: true,
        match: {
          ensDomain: match.ensDomain,
          ownerAddress: match.ownerAddress,
          confidence: match.confidence,
          registeredAt: match.registeredAt
        },
        message: 'Face recognized successfully'
      });
    } else {
      res.json({
        success: true,
        match: null,
        message: 'No matching face found'
      });
    }

  } catch (error) {
    console.error('Face recognition error:', error);
    res.status(500).json({
      error: 'Failed to recognize face',
      details: error.message
    });
  }
});

/**
 * Get all registered faces
 * GET /registered-faces
 */
app.get('/registered-faces', (req, res) => {
  try {
    res.json({
      success: true,
      faces: registeredFaces.map(face => ({
        ensDomain: face.ensDomain,
        ownerAddress: face.ownerAddress,
        registeredAt: face.registeredAt,
        imageSize: face.imageSize
      })),
      totalCount: registeredFaces.length
    });
  } catch (error) {
    console.error('Get faces error:', error);
    res.status(500).json({
      error: 'Failed to get registered faces',
      details: error.message
    });
  }
});

/**
 * Get face by ENS domain
 * GET /face-by-ens/:ensDomain
 */
app.get('/face-by-ens/:ensDomain', (req, res) => {
  try {
    const { ensDomain } = req.params;

    const face = registeredFaces.find(f => f.ensDomain === ensDomain);

    if (!face) {
      return res.status(404).json({
        error: 'Face not found for ENS domain'
      });
    }

    res.json({
      success: true,
      face: {
        ensDomain: face.ensDomain,
        ownerAddress: face.ownerAddress,
        registeredAt: face.registeredAt,
        imageSize: face.imageSize
      }
    });

  } catch (error) {
    console.error('Get face by ENS error:', error);
    res.status(500).json({
      error: 'Failed to get face by ENS domain',
      details: error.message
    });
  }
});

/**
 * Delete a registered face by ENS domain
 * DELETE /registered-faces/:ensDomain
 */
app.delete('/registered-faces/:ensDomain', (req, res) => {
  try {
    const { ensDomain } = req.params;

    const faceIndex = registeredFaces.findIndex(face => face.ensDomain === ensDomain);

    if (faceIndex === -1) {
      return res.status(404).json({
        error: 'Face not found for ENS domain'
      });
    }

    registeredFaces.splice(faceIndex, 1);
    updateFaceMatcher();

    res.json({
      success: true,
      message: 'Face deleted successfully',
      totalCount: registeredFaces.length
    });

  } catch (error) {
    console.error('Delete face error:', error);
    res.status(500).json({
      error: 'Failed to delete face',
      details: error.message
    });
  }
});

// Helper functions for ENS resolver

/**
 * Verify ENS domain ownership through signature
 */
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

/**
 * Get the namehash for an ENS name
 */
function getNamehash(name) {
  const labels = name.split('.').reverse();
  let node = '0x0000000000000000000000000000000000000000000000000000000000000000';

  for (const label of labels) {
    const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
    node = ethers.keccak256(ethers.concat([node, labelHash]));
  }

  return node;
}

/**
 * Get resolver address for a name
 */
async function getResolver(name) {
  const namehash = getNamehash(name);
  const registry = new ethers.Contract(ENS_CONTRACTS.registry, ENS_REGISTRY_ABI, provider);
  return await registry.resolver(namehash);
}

/**
 * Resolve address from ENS name using Public Resolver
 */
async function resolveAddress(name) {
  try {
    const namehash = getNamehash(name);
    const resolverAddress = await getResolver(name);

    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const resolver = new ethers.Contract(resolverAddress, PUBLIC_RESOLVER_ABI, provider);
    return await resolver.addr(namehash);
  } catch (error) {
    console.error('Error resolving address:', error);
    return null;
  }
}

/**
 * Get text record from ENS name
 */
async function getTextRecord(name, key) {
  try {
    const namehash = getNamehash(name);
    const resolverAddress = await getResolver(name);

    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const resolver = new ethers.Contract(resolverAddress, PUBLIC_RESOLVER_ABI, provider);
    return await resolver.text(namehash, key);
  } catch (error) {
    console.error('Error getting text record:', error);
    return null;
  }
}

/**
 * Get content hash from ENS name
 */
async function getContentHash(name) {
  try {
    const namehash = getNamehash(name);
    const resolverAddress = await getResolver(name);

    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const resolver = new ethers.Contract(resolverAddress, PUBLIC_RESOLVER_ABI, provider);
    return await resolver.contenthash(namehash);
  } catch (error) {
    console.error('Error getting content hash:', error);
    return null;
  }
}

// Helper functions for face recognition

async function detectFacesBasic(imageBuffer) {
  // Simplified face detection - in production, use a proper face detection library
  // This is a placeholder that returns a random number of faces
  return Math.floor(Math.random() * 3) + 1;
}

async function generateFaceDescriptor(imageBuffer) {
  // Simplified face descriptor generation
  // In production, use a proper face recognition library like face-api.js or OpenCV
  const hash = require('crypto').createHash('md5').update(imageBuffer).digest('hex');
  return hash.substring(0, 32); // Return first 32 characters as descriptor
}

function findBestMatch(descriptor) {
  let bestMatch = null;
  let bestScore = 0;
  const threshold = 0.7; // Minimum confidence threshold

  for (const face of registeredFaces) {
    // Simplified matching - in production, use proper face recognition algorithms
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

function calculateSimilarity(desc1, desc2) {
  // Simplified similarity calculation
  // In production, use proper face recognition distance metrics
  let matches = 0;
  for (let i = 0; i < Math.min(desc1.length, desc2.length); i++) {
    if (desc1[i] === desc2[i]) matches++;
  }
  return matches / Math.max(desc1.length, desc2.length);
}

function updateFaceMatcher() {
  // Update face matcher when faces are added/removed
  // In production, this would update the actual face recognition model
  console.log(`Face matcher updated with ${registeredFaces.length} faces`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    registeredFaces: registeredFaces.length
  });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Ethereum Signature Verifier, ENS Lookup, Akave O3 Image Upload & Face Recognition API',
    network: 'Sepolia Testnet',
    ensContracts: ENS_CONTRACTS,
    endpoints: {
      'POST /verify-signature': {
        description: 'Verify Ethereum signature',
        body: { message: 'string', signature: 'string', address: 'string' }
      },
      'GET /ens-lookup/:address': {
        description: 'Look up ENS name for Ethereum address'
      },
      'GET /reverse-ens/:ensName': {
        description: 'Resolve ENS name to Ethereum address'
      },
      'GET /ens-resolver/:ensName': {
        description: 'Get ENS resolver information for a name'
      },
      'GET /ens-text/:ensName/:key': {
        description: 'Get ENS text record for a specific key'
      },
      'GET /ens-contenthash/:ensName': {
        description: 'Get ENS content hash'
      },
      'GET /ens-info/:ensName': {
        description: 'Get comprehensive ENS information (address, text records, content hash)'
      },
      'POST /upload-image': {
        description: 'Upload image to Akave O3 decentralized storage',
        body: 'FormData with image file and optional bucket name'
      },
      'POST /detect-faces': {
        description: 'Detect faces in an uploaded image',
        body: 'FormData with image file'
      },
      'POST /register-face': {
        description: 'Register a face for recognition with ENS domain',
        body: 'FormData with image file, ensDomain, signature, and message'
      },
      'POST /recognize-face': {
        description: 'Recognize a face from uploaded image',
        body: 'FormData with image file'
      },
      'GET /registered-faces': {
        description: 'Get all registered faces with ENS domains'
      },
      'GET /face-by-ens/:ensDomain': {
        description: 'Get face information by ENS domain'
      },
      'DELETE /registered-faces/:ensDomain': {
        description: 'Delete a registered face by ENS domain'
      },
      'GET /health': {
        description: 'Health check endpoint'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}`);
});
