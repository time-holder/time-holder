// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TIME is ERC20 {
  constructor() ERC20("Time", "TIME") {
    _mint(msg.sender, 31_536_000_000 * 10 ** decimals());
  }
}
