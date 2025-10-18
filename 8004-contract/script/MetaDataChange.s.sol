// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        string memory tokenURI = 'http://ec2-3-88-34-252.compute-1.amazonaws.com:3001';
    address registryAddr = vm.envOr("REGISTRY_ADDRESS", address(0x8004a6090Cd10A7288092483047B097295Fb8847));
        IdentityRegistry registry = IdentityRegistry(registryAddr);
registry.setAgentUri(9, tokenURI);

        vm.stopBroadcast();
    }
}
