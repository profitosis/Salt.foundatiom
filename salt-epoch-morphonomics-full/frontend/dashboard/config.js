export const CONTRACT_ADDRESS = '0xYOUR_DEPLOYED_CONTRACT_ADDRESS'; // Replace with your deployed contract address

export const SALT_BRICK_NFT_ABI = [
  // ERC721 Standard Functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool _approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  
  // Custom Functions
  'function mint(address to, string memory uri) external',
  'function addPromptToScroll(uint256 tokenId, string memory content, uint256 price, string memory newTokenURI) external',
  'function getPromptCount(uint256 tokenId) view returns (uint256)',
  'function getPromptAt(uint256 tokenId, uint256 index) view returns (string memory, uint256, uint256)',
  'function getScrollValue(uint256 tokenId) view returns (uint256)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  'event PromptAdded(uint256 indexed tokenId, string content, uint256 price)',
  'event ScrollMinted(address indexed to, uint256 tokenId, string uri)'
];

export const NETWORK_CONFIG = {
  chainId: '0x5', // Goerli testnet (change as needed)
  chainName: 'Goerli Testnet',
  rpcUrls: ['https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID'],
  nativeCurrency: {
    name: 'Goerli ETH',
    symbol: 'gETH',
    decimals: 18
  },
  blockExplorerUrls: ['https://goerli.etherscan.io/']
};
