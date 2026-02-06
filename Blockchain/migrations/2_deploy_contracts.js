// migrations/2_deploy_contracts.js
const SimpleStorage = artifacts.require("IdentityRegistry");

module.exports = function (deployer) {
  deployer.deploy(SimpleStorage);
};