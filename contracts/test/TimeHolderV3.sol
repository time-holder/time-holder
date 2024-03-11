// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimeHolder} from "../TimeHolder.sol";

contract TimeHolderV3 is TimeHolder {
  function version ()
  external pure virtual override
  returns (string memory) {
    return "3.0.0";
  }
}
