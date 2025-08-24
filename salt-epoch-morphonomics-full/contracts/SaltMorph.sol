// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./SaltToken.sol";
import "./EpochManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract SaltMorph is Ownable {
    EpochManager public epochManager;
    mapping(uint256 => SaltToken) public epochTokens;
    event Morph(address indexed user, uint256 fromEpoch, uint256 toEpoch, uint256 burned, uint256 minted);
    constructor(address _epochManager) {
        epochManager = EpochManager(_epochManager);
    }
    function registerEpochToken(uint256 epochId, address token) external onlyOwner {
        epochTokens[epochId] = SaltToken(token);
    }
    function morph(uint256 amount) external {
        uint256 current = epochManager.currentEpoch();
        SaltToken oldToken = epochTokens[current];
        SaltToken newToken = epochTokens[current + 1];
        require(address(newToken) != address(0), "Next epoch not registered");
        oldToken.transferFrom(msg.sender, address(this), amount);
        oldToken.burn(amount);
        uint256 minted = amount / 2;
        newToken.mint(msg.sender, minted);
        emit Morph(msg.sender, current, current + 1, amount, minted);
    }
}