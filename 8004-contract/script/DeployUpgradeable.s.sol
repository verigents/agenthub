// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {ERC1967Proxy} from "src/ERC1967Proxy.sol";
import {IdentityRegistryUpgradeable} from "src/IdentityRegistryUpgradeable.sol";
import {ReputationRegistryUpgradeable} from "src/ReputationRegistryUpgradeable.sol";
import {ValidationRegistryUpgradeable} from "src/ValidationRegistryUpgradeable.sol";

contract DeployUpgradeable is Script {
    struct DeployResult {
        address identityProxy;
        address reputationProxy;
        address validationProxy;
        address identityImpl;
        address reputationImpl;
        address validationImpl;
    }

    function run() external returns (DeployResult memory) {
        vm.startBroadcast();

        // Deploy implementations
        IdentityRegistryUpgradeable identityImpl = new IdentityRegistryUpgradeable();
        ReputationRegistryUpgradeable reputationImpl = new ReputationRegistryUpgradeable();
        ValidationRegistryUpgradeable validationImpl = new ValidationRegistryUpgradeable();

        // Deploy proxies with init data
        bytes memory idInit = abi.encodeWithSelector(IdentityRegistryUpgradeable.initialize.selector);
        ERC1967Proxy identityProxy = new ERC1967Proxy(address(identityImpl), idInit);

        bytes memory repInit = abi.encodeWithSelector(ReputationRegistryUpgradeable.initialize.selector, address(identityProxy));
        ERC1967Proxy reputationProxy = new ERC1967Proxy(address(reputationImpl), repInit);

        bytes memory valInit = abi.encodeWithSelector(ValidationRegistryUpgradeable.initialize.selector, address(identityProxy));
        ERC1967Proxy validationProxy = new ERC1967Proxy(address(validationImpl), valInit);

        console2.log("Identity Proxy:", address(identityProxy));
        console2.log("Reputation Proxy:", address(reputationProxy));
        console2.log("Validation Proxy:", address(validationProxy));
        console2.log("Identity Impl:", address(identityImpl));
        console2.log("Reputation Impl:", address(reputationImpl));
        console2.log("Validation Impl:", address(validationImpl));

        vm.stopBroadcast();

        return DeployResult({
            identityProxy: address(identityProxy),
            reputationProxy: address(reputationProxy),
            validationProxy: address(validationProxy),
            identityImpl: address(identityImpl),
            reputationImpl: address(reputationImpl),
            validationImpl: address(validationImpl)
        });
    }
}


