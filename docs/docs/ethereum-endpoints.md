# Ethereum Endpoints

Detailed documentation for Ethereum-related API endpoints including signature verification, ENS operations, and ENS resolver functionality on Sepolia testnet.

## Signature Verification

### POST /verify-signature

Verify an Ethereum signature against a message and address using the `ethers.js` library.

#### Request

**Content-Type:** `application/json`

**Body:**
```json
{
  "message": "Hello World",
  "signature": "0x1234...",
  "address": "0x5678..."
}
```

**Parameters:**
- `message` (string, required): The original message that was signed
- `signature` (string, required): The Ethereum signature (0x-prefixed hex string)
- `address` (string, required): The Ethereum address that should have signed the message

#### Response

**Success (200):**
```json
{
  "isValid": true,
  "recoveredAddress": "0x5678...",
  "providedAddress": "0x5678...",
  "message": "Signature verification completed"
}
```

**Error (400):**
```json
{
  "error": "Missing required fields: message, signature, address"
}
```

**Error (500):**
```json
{
  "error": "Failed to verify signature",
  "details": "Invalid signature format"
}
```

#### Example Usage

```bash
curl -X POST http://localhost:3000/verify-signature \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello World",
    "signature": "0x1234567890abcdef...",
    "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

#### JavaScript Example

```javascript
const response = await fetch('http://localhost:3000/verify-signature', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello World',
    signature: '0x1234567890abcdef...',
    address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  })
});

const result = await response.json();
console.log(result.isValid); // true or false
```

## ENS Lookup

### GET /ens-lookup/:address

Look up the ENS (Ethereum Name Service) name for a given Ethereum address.

#### Request

**URL:** `GET /ens-lookup/{address}`

**Parameters:**
- `address` (string, required): Ethereum address to look up (must be valid Ethereum address format)

#### Response

**Success (200):**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "ensName": "vitalik.eth",
  "hasEnsName": true
}
```

**No ENS Name (200):**
```json
{
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "ensName": null,
  "hasEnsName": false
}
```

**Error (400):**
```json
{
  "error": "Invalid Ethereum address format"
}
```

**Error (500):**
```json
{
  "error": "Failed to lookup ENS name",
  "details": "Network error"
}
```

#### Example Usage

```bash
# Look up ENS name for Vitalik's address
curl http://localhost:3000/ens-lookup/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

#### JavaScript Example

```javascript
const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const response = await fetch(`http://localhost:3000/ens-lookup/${address}`);
const result = await response.json();

if (result.hasEnsName) {
  console.log(`Address ${address} has ENS name: ${result.ensName}`);
} else {
  console.log(`Address ${address} has no ENS name`);
}
```

## Reverse ENS Lookup

### GET /reverse-ens/:ensName

Resolve an ENS name to its Ethereum address.

#### Request

**URL:** `GET /reverse-ens/{ensName}`

**Parameters:**
- `ensName` (string, required): ENS name to resolve (e.g., "vitalik.eth")

#### Response

**Success (200):**
```json
{
  "ensName": "vitalik.eth",
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "isResolved": true
}
```

**Error (404):**
```json
{
  "error": "ENS name not found or not resolvable"
}
```

**Error (500):**
```json
{
  "error": "Failed to resolve ENS name",
  "details": "Network error"
}
```

#### Example Usage

```bash
# Resolve vitalik.eth to address
curl http://localhost:3000/reverse-ens/vitalik.eth
```

#### JavaScript Example

```javascript
const ensName = 'vitalik.eth';
const response = await fetch(`http://localhost:3000/reverse-ens/${ensName}`);
const result = await response.json();

if (result.isResolved) {
  console.log(`ENS name ${ensName} resolves to: ${result.address}`);
} else {
  console.log(`ENS name ${ensName} could not be resolved`);
}
```

## Implementation Details

### Signature Verification Process

1. **Input Validation**: Check that all required fields are present
2. **Address Validation**: Verify the address format using `ethers.isAddress()`
3. **Signature Recovery**: Use `ethers.verifyMessage()` to recover the address from the signature
4. **Comparison**: Compare the recovered address with the provided address (case-insensitive)

### ENS Resolution Process

1. **Address Validation**: Ensure the provided address is valid
2. **ENS Lookup**: Use `provider.lookupAddress()` to find the ENS name
3. **Response Formatting**: Return the result with appropriate flags

### Error Handling

The endpoints include comprehensive error handling for:

- **Invalid Input**: Missing or malformed parameters
- **Network Issues**: RPC provider connectivity problems
- **Invalid Addresses**: Malformed Ethereum addresses
- **ENS Resolution Failures**: Non-existent or unresolvable ENS names

### Performance Considerations

- **Caching**: Consider implementing ENS result caching for frequently requested addresses
- **Rate Limiting**: Monitor RPC provider rate limits
- **Timeout Handling**: Implement appropriate timeouts for RPC calls

## Common Use Cases

### 1. Wallet Authentication

```javascript
// Verify user's wallet signature for authentication
const verifyWallet = async (message, signature, address) => {
  const response = await fetch('http://localhost:3000/verify-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature, address })
  });
  
  const result = await response.json();
  return result.isValid;
};
```

### 2. ENS Name Display

```javascript
// Display ENS name if available, otherwise show address
const displayName = async (address) => {
  const response = await fetch(`http://localhost:3000/ens-lookup/${address}`);
  const result = await response.json();
  
  return result.hasEnsName ? result.ensName : address;
};
```

### 3. Address Resolution

```javascript
// Resolve ENS name to address for transactions
const resolveAddress = async (ensName) => {
  const response = await fetch(`http://localhost:3000/reverse-ens/${ensName}`);
  const result = await response.json();
  
  if (result.isResolved) {
    return result.address;
  } else {
    throw new Error(`Could not resolve ENS name: ${ensName}`);
  }
};
```

## ENS Resolver Endpoints

### GET /ens-resolver/:ensName

Get ENS resolver information for a name on Sepolia testnet.

#### Request

**URL:** `GET /ens-resolver/{ensName}`

**Parameters:**
- `ensName` (string, required): ENS name to get resolver info for (e.g., "alice.eth")

#### Response

**Success (200):**
```json
{
  "ensName": "alice.eth",
  "namehash": "0x1234567890abcdef...",
  "resolverAddress": "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5",
  "hasResolver": true
}
```

**No Resolver (200):**
```json
{
  "ensName": "alice.eth",
  "namehash": "0x1234567890abcdef...",
  "resolverAddress": null,
  "hasResolver": false
}
```

#### Example Usage

```bash
# Get resolver info for ENS name
curl http://localhost:3000/ens-resolver/alice.eth
```

### GET /ens-text/:ensName/:key

Get ENS text record for a specific key.

#### Request

**URL:** `GET /ens-text/{ensName}/{key}`

**Parameters:**
- `ensName` (string, required): ENS name to get text record for
- `key` (string, required): Text record key (e.g., "description", "url", "avatar")

#### Response

**Success (200):**
```json
{
  "ensName": "alice.eth",
  "key": "description",
  "value": "Alice's personal website",
  "hasRecord": true
}
```

**No Record (200):**
```json
{
  "ensName": "alice.eth",
  "key": "description",
  "value": null,
  "hasRecord": false
}
```

#### Example Usage

```bash
# Get description text record
curl http://localhost:3000/ens-text/alice.eth/description

# Get URL text record
curl http://localhost:3000/ens-text/alice.eth/url

# Get avatar text record
curl http://localhost:3000/ens-text/alice.eth/avatar
```

### GET /ens-contenthash/:ensName

Get ENS content hash for IPFS/Arweave storage.

#### Request

**URL:** `GET /ens-contenthash/{ensName}`

**Parameters:**
- `ensName` (string, required): ENS name to get content hash for

#### Response

**Success (200):**
```json
{
  "ensName": "alice.eth",
  "contentHash": "0xe30101701220...",
  "hasContentHash": true
}
```

**No Content Hash (200):**
```json
{
  "ensName": "alice.eth",
  "contentHash": null,
  "hasContentHash": false
}
```

#### Example Usage

```bash
# Get content hash for ENS name
curl http://localhost:3000/ens-contenthash/alice.eth
```

### GET /ens-info/:ensName

Get comprehensive ENS information including address, text records, and content hash.

#### Request

**URL:** `GET /ens-info/{ensName}`

**Parameters:**
- `ensName` (string, required): ENS name to get comprehensive info for

#### Response

**Success (200):**
```json
{
  "ensName": "alice.eth",
  "namehash": "0x1234567890abcdef...",
  "resolverAddress": "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5",
  "address": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "contentHash": "0xe30101701220...",
  "textRecords": {
    "description": "Alice's personal website",
    "url": "https://alice.example.com",
    "avatar": "https://alice.example.com/avatar.jpg",
    "twitter": "alice",
    "github": "alice"
  },
  "hasResolver": true,
  "hasAddress": true,
  "hasContentHash": true
}
```

#### Example Usage

```bash
# Get comprehensive ENS info
curl http://localhost:3000/ens-info/alice.eth
```

#### JavaScript Example

```javascript
const getENSInfo = async (ensName) => {
  const response = await fetch(`http://localhost:3000/ens-info/${ensName}`);
  const result = await response.json();
  return result;
};

// Usage
const displayENSInfo = async (ensName) => {
  const info = await getENSInfo(ensName);
  
  if (info.hasAddress) {
    console.log(`ENS: ${info.ensName}`);
    console.log(`Address: ${info.address}`);
    console.log(`Description: ${info.textRecords.description || 'No description'}`);
    console.log(`Website: ${info.textRecords.url || 'No website'}`);
  } else {
    console.log(`ENS name ${ensName} not found or not resolvable`);
  }
};
```

## Sepolia Testnet Configuration

The server is configured to use Sepolia testnet with the following ENS contract addresses:

- **Registry**: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`
- **Public Resolver**: `0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5`
- **Universal Resolver**: `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe`

## Next Steps

- [Image Storage Endpoints](./image-storage-endpoints.md) - Image upload and storage
- [Face Recognition Endpoints](./face-recognition-endpoints.md) - Face detection and recognition with ENS integration
- [Usage Examples](./usage-examples.md) - Practical examples
- [Curl Examples](./curl-examples.md) - Command-line examples
