let WillContract = artifacts.require("WillContract");
contract('WillContract', function(accounts) {
  it("should not have any fee", async function() {
    let instance = await WillContract.deployed();
    var val = await instance.getReleaseFee();
    assert.equal(val, 0, "should have no relese fee");

  });
  it("should not be open for release", async function() {
    let instance = await WillContract.deployed();
    let val = await instance.isOpenForRelease();
    assert.equal(val, false, "should not be open for release");
  });
  it("should have no beneficiary", async function() {
    let instance = await WillContract.deployed();
    let val = await instance.getNumberBeneficiaries();
    assert.equal(val, 0, "should have no beneficiary");
  });


});
