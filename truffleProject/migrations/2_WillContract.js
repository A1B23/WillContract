var MyContract = artifacts.require("WillContract");

module.exports = function(deployer) {
  // deployment steps
  const refCode = 0x124;
  deployer.deploy(MyContract,refCode);
};