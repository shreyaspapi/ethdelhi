# Introduction

Welcome to the Ethereum Server API documentation! This comprehensive Node.js server provides powerful capabilities for Ethereum signature verification, ENS lookup and resolver operations on Sepolia testnet, decentralized image storage via Akave O3, and face recognition with ENS domain integration.

## What is this API?

The Ethereum Server API is a robust backend service that combines multiple cutting-edge technologies:

- **🔐 Ethereum Integration**: Signature verification and ENS (Ethereum Name Service) operations on Sepolia testnet
- **🌐 ENS Resolver**: Full ENS resolver functionality with text records, content hash, and comprehensive domain information
- **☁️ Decentralized Storage**: Image uploads to Akave O3 decentralized storage
- **👤 Face Recognition**: Advanced face detection and recognition with ENS domain linking
- **🚀 High Performance**: Optimized image processing with Sharp
- **🔒 Security**: Built-in validation, cryptographic proof, and error handling

## Key Features

### 🔐 **Ethereum Signature Verification**
- Verify Ethereum signatures against messages and addresses
- Support for all standard Ethereum signature formats
- Comprehensive error handling and validation

### 🌐 **ENS Integration & Resolver**
- Look up ENS names for Ethereum addresses
- Reverse ENS lookup (resolve ENS names to addresses)
- ENS resolver information and text records
- Content hash resolution for IPFS/Arweave storage
- Comprehensive ENS domain information
- Full ENS protocol support on Sepolia testnet

### ☁️ **Decentralized Image Storage**
- Upload images to Akave O3 decentralized storage
- Automatic image optimization and resizing
- Public URL generation for uploaded images
- Support for custom bucket names

### 👤 **Face Recognition System with ENS Integration**
- Face detection in uploaded images
- Face registration linked to ENS domains
- Cryptographic proof of ENS domain ownership
- Face recognition with ENS domain identity
- Confidence scoring for matches
- Face management by ENS domain (list, delete registered faces)

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

The API is organized into five main categories:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Ethereum** | `/verify-signature`, `/ens-lookup/*`, `/reverse-ens/*` | Signature verification and ENS operations |
| **ENS Resolver** | `/ens-resolver/*`, `/ens-text/*`, `/ens-contenthash/*`, `/ens-info/*` | ENS resolver operations on Sepolia testnet |
| **Image Storage** | `/upload-image` | Upload images to Akave O3 |
| **Face Detection** | `/detect-faces` | Detect faces in images |
| **Face Recognition** | `/register-face`, `/recognize-face`, `/registered-faces`, `/face-by-ens/*` | Face registration and recognition with ENS integration |

## What's Next?

- [Installation Guide](./installation.md) - Set up the server
- [Configuration](./configuration.md) - Configure your environment
- [API Reference](./api-reference.md) - Complete API documentation
- [Usage Examples](./usage-examples.md) - Practical examples

Ready to get started? Let's begin with the [installation guide](./installation.md)!
