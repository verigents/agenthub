// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {ERC1967Proxy} from "../src/ERC1967Proxy.sol";
import {IdentityRegistryUpgradeable} from "../src/IdentityRegistryUpgradeable.sol";
import {ReputationRegistryUpgradeable} from "../src/ReputationRegistryUpgradeable.sol";
import {ValidationRegistryUpgradeable} from "../src/ValidationRegistryUpgradeable.sol";

interface IIdentityUpgradeable {
    function initialize() external;
    function getVersion() external view returns (string memory);
    function register(string memory tokenURI) external returns (uint256);
    function tokenURI(uint256 id) external view returns (string memory);
    function owner() external view returns (address);
    function upgradeToAndCall(address newImplementation, bytes calldata data) external;
}

interface IReputationUpgradeable {
    function initialize(address identity) external;
    function getVersion() external view returns (string memory);
    function getIdentityRegistry() external view returns (address);
    function upgradeToAndCall(address newImplementation, bytes calldata data) external;
}

interface IValidationUpgradeable {
    function initialize(address identity) external;
    function getVersion() external view returns (string memory);
    function getIdentityRegistry() external view returns (address);
    function upgradeToAndCall(address newImplementation, bytes calldata data) external;
}

contract UpgradeableTest is Test {
    function _deployIdentityProxy() internal returns (IIdentityUpgradeable id) {
        IdentityRegistryUpgradeable impl = new IdentityRegistryUpgradeable();
        bytes memory initCalldata = abi.encodeWithSelector(IIdentityUpgradeable.initialize.selector);
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initCalldata);
        id = IIdentityUpgradeable(address(proxy));
    }

    function _deployReputationProxy(address identity) internal returns (IReputationUpgradeable rep) {
        ReputationRegistryUpgradeable impl = new ReputationRegistryUpgradeable();
        bytes memory initCalldata = abi.encodeWithSelector(IReputationUpgradeable.initialize.selector, identity);
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initCalldata);
        rep = IReputationUpgradeable(address(proxy));
    }

    function _deployValidationProxy(address identity) internal returns (IValidationUpgradeable val) {
        ValidationRegistryUpgradeable impl = new ValidationRegistryUpgradeable();
        bytes memory initCalldata = abi.encodeWithSelector(IValidationUpgradeable.initialize.selector, identity);
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initCalldata);
        val = IValidationUpgradeable(address(proxy));
    }

    function test_IdentityProxyInitializeAndOwner() public {
        IIdentityUpgradeable id = _deployIdentityProxy();
        assertEq(id.getVersion(), "1.0.0");
        assertEq(id.owner(), address(this));
    }

    function test_IdentityProxyUpgradeMaintainsState() public {
        IIdentityUpgradeable id = _deployIdentityProxy();
        // Register from an EOA (makeAddr) to avoid safeMint to Test contract
        address user = makeAddr("user");
        vm.prank(user);
        uint256 agentId = id.register("ipfs://v1");

        IdentityRegistryUpgradeable implV2 = new IdentityRegistryUpgradeable();
        id.upgradeToAndCall(address(implV2), "0x");

        assertEq(id.tokenURI(agentId), "ipfs://v1");
        vm.prank(user);
        uint256 newId = id.register("ipfs://v2");
        assertGt(newId, agentId);
    }

    function test_ReputationProxyInitializeAndUpgrade() public {
        IIdentityUpgradeable id = _deployIdentityProxy();
        IReputationUpgradeable rep = _deployReputationProxy(address(id));
        assertEq(rep.getVersion(), "1.0.0");
        assertEq(rep.getIdentityRegistry(), address(id));

        ReputationRegistryUpgradeable implV2 = new ReputationRegistryUpgradeable();
        rep.upgradeToAndCall(address(implV2), "0x");
        assertEq(rep.getIdentityRegistry(), address(id));
    }

    function test_ValidationProxyInitializeAndUpgrade() public {
        IIdentityUpgradeable id = _deployIdentityProxy();
        IValidationUpgradeable val = _deployValidationProxy(address(id));
        assertEq(val.getVersion(), "1.0.0");
        assertEq(val.getIdentityRegistry(), address(id));

        ValidationRegistryUpgradeable implV2 = new ValidationRegistryUpgradeable();
        val.upgradeToAndCall(address(implV2), "0x");
        assertEq(val.getIdentityRegistry(), address(id));
    }
}


