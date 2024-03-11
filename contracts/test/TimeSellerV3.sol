// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimeSeller} from "../TimeSeller.sol";

contract TimeSellerV3 is TimeSeller {
  function version ()
  external pure virtual override
  returns (string memory) {
    return "3.0.0";
  }
}
