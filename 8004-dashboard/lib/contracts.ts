import { parseAbi } from "viem";

export const identityAbi = parseAbi([
  "event Registered(uint256 indexed agentId, string tokenURI, address indexed owner)",
  "event MetadataSet(uint256 indexed agentId, string indexed indexedKey, string key, bytes value)",
  "event UriUpdated(uint256 indexed agentId, string newUri, address indexed updatedBy)",
  "function register() returns (uint256 agentId)",
  "function register(string tokenUri) returns (uint256 agentId)",
  "function register((string key, bytes value)[] metadata) returns (uint256 agentId)",
  "function register(string tokenUri, (string key, bytes value)[] metadata) returns (uint256 agentId)",
  "function getMetadata(uint256 agentId, string key) view returns (bytes)",
  "function setMetadata(uint256 agentId, string key, bytes value)",
  "function setAgentUri(uint256 agentId, string newUri)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
]);

export const reputationAbi = parseAbi([
  "function giveFeedback(uint256 agentId, uint8 score, bytes32 tag1, bytes32 tag2, string feedbackUri, bytes32 feedbackHash, bytes feedbackAuth)",
  "function revokeFeedback(uint256 agentId, uint64 feedbackIndex)",
  "function appendResponse(uint256 agentId, address clientAddress, uint64 feedbackIndex, string responseUri, bytes32 responseHash)",
  "function getSummary(uint256 agentId, address[] clientAddresses, bytes32 tag1, bytes32 tag2) view returns (uint64 count, uint8 averageScore)",
  "function getLastIndex(uint256 agentId, address clientAddress) view returns (uint64)",
]);

export const validationAbi = parseAbi([
  "function validationRequest(address validatorAddress, uint256 agentId, string requestUri, bytes32 requestHash)",
  "function validationResponse(bytes32 requestHash, uint8 response, string responseUri, bytes32 responseHash, bytes32 tag)",
  "function getSummary(uint256 agentId, address[] validatorAddresses, bytes32 tag) view returns (uint64 count, uint8 avgResponse)",
]);


