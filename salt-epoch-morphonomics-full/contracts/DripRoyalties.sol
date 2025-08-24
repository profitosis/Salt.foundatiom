// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract DripRoyalties is Ownable {
    IERC20 public saltToken;
    uint256 public dripPool;
    mapping(address => uint256) public claimed;
    mapping(address => uint256) public lastClaim;
    event DripFunded(uint256 amount);
    event Dripped(address indexed user, uint256 amount);
    constructor(address _saltToken) {
        saltToken = IERC20(_saltToken);
    }
    receive() external payable {
        dripPool += msg.value;
        emit DripFunded(msg.value);
    }
    function claim() external {
        require(dripPool > 0, "Nothing to claim");
        uint256 userBalance = saltToken.balanceOf(msg.sender);
        require(userBalance > 0, "No SALT");
        uint256 totalSupply = saltToken.totalSupply();
        uint256 payout = (userBalance * dripPool) / totalSupply;
        dripPool -= payout;
        claimed[msg.sender] += payout;
        payable(msg.sender).transfer(payout);
        emit Dripped(msg.sender, payout);
    }
}