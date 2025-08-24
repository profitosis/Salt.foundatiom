// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
contract SaltToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER");
    uint256 public epochId;
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _epochId,
        address admin
    ) ERC20(name, symbol) {
        epochId = _epochId;
        _mint(admin, initialSupply);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
    function burn(uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(msg.sender, amount);
    }
    function burnFrom(address account, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(account, amount);
    }
}