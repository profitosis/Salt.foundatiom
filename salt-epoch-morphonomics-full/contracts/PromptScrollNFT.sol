// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PromptScrollNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct PromptEntry {
        string content;
        uint256 price;
        uint256 timestamp;
    }

    // Mapping from token ID to array of prompt entries
    mapping(uint256 => PromptEntry[]) public promptScrolls;
    
    // Mapping from token ID to total value
    mapping(uint256 => uint256) public scrollValues;

    event PromptAdded(uint256 indexed tokenId, string content, uint256 price);
    event ScrollMinted(address indexed to, uint256 tokenId, string initialURI);

    constructor() ERC721("PromptScroll", "SCROLL") {}

    function mintScroll(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        emit ScrollMinted(to, newTokenId, tokenURI);
        return newTokenId;
    }

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
        
        // Update token URI if new one provided
        if (bytes(newTokenURI).length > 0) {
            _setTokenURI(tokenId, newTokenURI);
        }
        
        emit PromptAdded(tokenId, content, price);
    }

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
}
