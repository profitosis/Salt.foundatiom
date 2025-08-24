// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract EpochManager {
    uint256 public currentEpoch;
    mapping(uint256 => uint256) public epochSupply;
    address public controller;
    event EpochAdvanced(uint256 indexed newEpoch, uint256 supplyCap);
    modifier onlyController() {
        require(msg.sender == controller, "Not controller");
        _;
    }
    constructor(uint256 initialSupply, address _controller) {
        currentEpoch = 1;
        epochSupply[1] = initialSupply;
        controller = _controller;
    }
    function advanceEpoch() external onlyController {
        currentEpoch++;
        epochSupply[currentEpoch] = epochSupply[currentEpoch - 1] / 2;
        emit EpochAdvanced(currentEpoch, epochSupply[currentEpoch]);
    }
}