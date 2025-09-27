# Introduction

Welcome to the Ethereum Server API documentation! This comprehensive Node.js server provides powerful capabilities for Ethereum signature verification, ENS lookup, decentralized image storage via Akave O3, and face recognition.

## What is this API?

The Ethereum Server API is a robust backend service that combines multiple cutting-edge technologies:

- **🔐 Ethereum Integration**: Signature verification and ENS (Ethereum Name Service) operations
- **☁️ Decentralized Storage**: Image uploads to Akave O3 decentralized storage
- **👤 Face Recognition**: Advanced face detection and recognition capabilities
- **🚀 High Performance**: Optimized image processing with Sharp
- **🔒 Security**: Built-in validation and error handling

## Key Features

### 🔐 **Ethereum Signature Verification**
- Verify Ethereum signatures against messages and addresses
- Support for all standard Ethereum signature formats
- Comprehensive error handling and validation

### 🌐 **ENS Integration**
- Look up ENS names for Ethereum addresses
- Reverse ENS lookup (resolve ENS names to addresses)
- Full ENS protocol support

### ☁️ **Decentralized Image Storage**
- Upload images to Akave O3 decentralized storage
- Automatic image optimization and resizing
- Public URL generation for uploaded images
- Support for custom bucket names

### 👤 **Face Recognition System**
- Face detection in uploaded images
- Face registration and recognition
- Confidence scoring for matches
- Face management (list, delete registered faces)

### 🚀 **High Performance**
- Optimized image processing with Sharp
- Memory-efficient file handling
- Automatic image format conversion
- Configurable file size limits

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Akave O3 credentials
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Test the API**
   ```bash
   curl http://localhost:3000/health
   ```

## API Overview

The API is organized into four main categories:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Ethereum** | `/verify-signature`, `/ens-lookup/*`, `/reverse-ens/*` | Signature verification and ENS operations |
| **Image Storage** | `/upload-image` | Upload images to Akave O3 |
| **Face Detection** | `/detect-faces` | Detect faces in images |
| **Face Recognition** | `/register-face`, `/recognize-face`, `/registered-faces` | Face registration and recognition |

## What's Next?

- [Installation Guide](./installation.md) - Set up the server
- [Configuration](./configuration.md) - Configure your environment
- [API Reference](./api-reference.md) - Complete API documentation
- [Usage Examples](./usage-examples.md) - Practical examples

Ready to get started? Let's begin with the [installation guide](./installation.md)!
