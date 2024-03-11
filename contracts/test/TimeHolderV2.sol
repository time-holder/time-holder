// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimeHolder} from "../TimeHolder.sol";

contract TimeHolderV2 is TimeHolder {
  function version ()
  external pure virtual override
  returns (string memory) {
    return "2.0.0";
  }
}
