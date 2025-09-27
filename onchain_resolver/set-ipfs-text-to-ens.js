require("dotenv").config();
const { ethers } = require("ethers");
const namehash = require("eth-ens-namehash");

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
  );

  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const ensName = process.env.ENS_NAME; // pulled from .env
  const key = "face-lookup";
  const value = "ipfs://QmYourIPFSHash"; // you can also put this in .env if it changes often

  const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const ENSRegistryABI = [
    "function resolver(bytes32 node) view returns (address)"
  ];
  const ensRegistry = new ethers.Contract(
    ENS_REGISTRY_ADDRESS,
    ENSRegistryABI,
    provider
  );

  const node = namehash.hash(ensName);
  const resolverAddress = await ensRegistry.resolver(node);

  const ResolverABI = [
    "function setText(bytes32 node, string key, string value) external"
  ];
  const resolver = new ethers.Contract(resolverAddress, ResolverABI, wallet);

  console.log(`Setting ENS record for ${ensName}...`);
  const tx = await resolver.setText(node, key, value);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✅ Text record set successfully!");
}

main().catch(console.error);
