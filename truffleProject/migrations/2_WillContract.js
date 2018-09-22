var MyContract = artifacts.require("WillContract");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(MyContract);
};