// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract SaltBrickNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Math for uint256;
    
    uint256 private _nextTokenId = 0;
    
    // Salt properties
    uint256 public constant TOTAL_SUPPLY = 9900 * (10**18); // 9,900 kg with 18 decimals
    uint256 public totalMinted = 0;
    
    struct PromptEntry {
        string content;
        uint256 price;
        uint256 timestamp;
    }
    
    struct SaltBrick {
        uint256 saltAmount; // Amount of salt in wei (1e18 = 1 kg)
        uint256 createdAt;
        uint256 splitCooldown; // Timestamp when this brick can be split again
    }

    // Original NFT properties
    address public royaltiesReceiver;
    uint96 public royaltyBps;
    
    // Salt Brick tracking
    mapping(uint256 => SaltBrick) public saltBricks;
    
    // Prompt Scroll functionality
    mapping(uint256 => PromptEntry[]) public promptScrolls;
    mapping(uint256 => uint256) public scrollValues;
    
    // Constants
    uint256 public constant MIN_SPLIT_AMOUNT = 1 * (10**17); // 0.1 kg minimum to split
    uint256 public constant SPLIT_COOLDOWN = 1 days; // 24 hour cooldown between splits
    
    // Events
    event PromptAdded(uint256 indexed tokenId, string content, uint256 price);
    event ScrollMinted(address indexed to, uint256 tokenId, string uri, uint256 saltAmount);
    event SaltBrickSplit(uint256 indexed originalTokenId, uint256 newTokenId1, uint256 newTokenId2, uint256 splitAmount);
    event SaltBricksMerged(uint256 indexed tokenId1, uint256 indexed tokenId2, uint256 newTokenId, uint256 totalAmount);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    // Mint a new salt brick with initial salt amount
    function mint(address to, string memory uri, uint256 saltAmount) external onlyOwner nonReentrant {
        require(totalMinted + saltAmount <= TOTAL_SUPPLY, "Exceeds total supply");
        require(saltAmount > 0, "Amount must be greater than 0");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        saltBricks[tokenId] = SaltBrick({
            saltAmount: saltAmount,
            createdAt: block.timestamp,
            splitCooldown: 0
        });
        
        totalMinted += saltAmount;
        emit ScrollMinted(to, tokenId, uri, saltAmount);
    }
    
    // Split a salt brick into two smaller bricks
    function splitBrick(uint256 tokenId) external nonReentrant {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not owner nor approved");
        require(saltBricks[tokenId].saltAmount >= MIN_SPLIT_AMOUNT * 2, "Amount too small to split");
        require(block.timestamp >= saltBricks[tokenId].splitCooldown, "Split cooldown active");
        
        uint256 splitAmount = saltBricks[tokenId].saltAmount / 2;
        uint256 remainder = saltBricks[tokenId].saltAmount - splitAmount;
        
        // Create two new bricks
        uint256 tokenId1 = _nextTokenId++;
        uint256 tokenId2 = _nextTokenId++;
        
        address owner = ownerOf(tokenId);
        
        // Burn the original brick
        _burn(tokenId);
        
        // Mint two new bricks
        _safeMint(owner, tokenId1);
        _safeMint(owner, tokenId2);
        
        // Set up the new bricks
        saltBricks[tokenId1] = SaltBrick({
            saltAmount: splitAmount,
            createdAt: block.timestamp,
            splitCooldown: block.timestamp + SPLIT_COOLDOWN
        });
        
        saltBricks[tokenId2] = SaltBrick({
            saltAmount: remainder,
            createdAt: block.timestamp,
            splitCooldown: block.timestamp + SPLIT_COOLDOWN
        });
        
        // Transfer prompts to the first new brick
        promptScrolls[tokenId1] = promptScrolls[tokenId];
        scrollValues[tokenId1] = scrollValues[tokenId];
        
        delete promptScrolls[tokenId];
        delete scrollValues[tokenId];
        
        emit SaltBrickSplit(tokenId, tokenId1, tokenId2, splitAmount);
    }
    
    // Merge two salt bricks into one
    function mergeBricks(uint256 tokenId1, uint256 tokenId2) external nonReentrant {
        require(_isApprovedOrOwner(_msgSender(), tokenId1) && _isApprovedOrOwner(_msgSender(), tokenId2), 
                "Not owner of both tokens");
        require(ownerOf(tokenId1) == ownerOf(tokenId2), "Tokens must have same owner");
        require(tokenId1 != tokenId2, "Cannot merge same token");
        
        address owner = ownerOf(tokenId1);
        uint256 totalAmount = saltBricks[tokenId1].saltAmount + saltBricks[tokenId2].saltAmount;
        
        // Burn the original bricks
        _burn(tokenId1);
        _burn(tokenId2);
        
        // Mint a new combined brick
        uint256 newTokenId = _nextTokenId++;
        _safeMint(owner, newTokenId);
        
        // Set up the new brick
        saltBricks[newTokenId] = SaltBrick({
            saltAmount: totalAmount,
            createdAt: block.timestamp,
            splitCooldown: block.timestamp + SPLIT_COOLDOWN
        });
        
        // Combine prompts from both bricks (simple concatenation)
        PromptEntry[] storage prompts1 = promptScrolls[tokenId1];
        PromptEntry[] storage prompts2 = promptScrolls[tokenId2];
        
        for (uint i = 0; i < prompts2.length; i++) {
            prompts1.push(prompts2[i]);
        }
        
        promptScrolls[newTokenId] = prompts1;
        scrollValues[newTokenId] = scrollValues[tokenId1] + scrollValues[tokenId2];
        
        // Clean up
        delete promptScrolls[tokenId1];
        delete promptScrolls[tokenId2];
        delete scrollValues[tokenId1];
        delete scrollValues[tokenId2];
        
        emit SaltBricksMerged(tokenId1, tokenId2, newTokenId, totalAmount);
    }
    
    // New function to add prompts to a scroll
    function addPromptToScroll(
        uint256 tokenId,
        string memory content,
        uint256 price,
        string memory newTokenURI
    ) external onlyOwner {
        require(_exists(tokenId), "Scroll does not exist");
        
        promptScrolls[tokenId].push(PromptEntry({
            content: content,
            price: price,
            timestamp: block.timestamp
        }));
        
        scrollValues[tokenId] += price;
        
        if (bytes(newTokenURI).length > 0) {
            _setTokenURI(tokenId, newTokenURI);
        }
        
        emit PromptAdded(tokenId, content, price);
    }
    
    // View functions for prompt data
    function getScrollValue(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Scroll does not exist");
        return scrollValues[tokenId];
    }

    function getPromptCount(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Scroll does not exist");
        return promptScrolls[tokenId].length;
    }

    function getPromptAt(uint256 tokenId, uint256 index) public view returns (string memory, uint256, uint256) {
        require(_exists(tokenId), "Scroll does not exist");
        require(index < promptScrolls[tokenId].length, "Index out of bounds");
        
        PromptEntry memory entry = promptScrolls[tokenId][index];
        return (entry.content, entry.price, entry.timestamp);
    }
    
    // Get salt brick information
    function getSaltBrickInfo(uint256 tokenId) public view returns (
        uint256 saltAmount,
        uint256 createdAt,
        uint256 splitCooldown,
        bool canSplit
    ) {
        require(_exists(tokenId), "Token does not exist");
        SaltBrick memory brick = saltBricks[tokenId];
        return (
            brick.saltAmount,
            brick.createdAt,
            brick.splitCooldown,
            brick.saltAmount >= MIN_SPLIT_AMOUNT * 2 && block.timestamp >= brick.splitCooldown
        );
    }
    
    // Get total remaining supply that can still be minted
    function getRemainingSupply() public view returns (uint256) {
        return TOTAL_SUPPLY - totalMinted;
    }
    
    // Override _burn to clean up storage
    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        delete saltBricks[tokenId];
    }
}