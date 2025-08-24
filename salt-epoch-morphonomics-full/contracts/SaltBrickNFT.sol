// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SaltBrickNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId;
    address public royaltiesReceiver;
    uint96 public royaltyBps;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, string memory uri) external onlyOwner {
        _safeMint(to, nextTokenId);
        _setTokenURI(nextTokenId, uri);
        nextTokenId++;
    }
}