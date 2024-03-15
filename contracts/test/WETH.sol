// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
  event Deposit(address indexed dst, uint wad);
  event Withdrawal(address indexed src, uint wad);

  constructor() ERC20("WETH", "WETH") {}

  fallback() external payable {
    deposit();
  }

  receive() external payable {
    deposit();
  }

  function deposit() public payable {
    _mint(msg.sender, msg.value);
    emit Deposit(msg.sender, msg.value);
  }

  function withdraw(uint amount) public {
    require(balanceOf(msg.sender) >= amount);
    _burn(msg.sender, amount);
    payable(msg.sender).transfer(amount);
    emit Withdrawal(msg.sender, amount);
  }
}
