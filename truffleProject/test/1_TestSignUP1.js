// TODO as the amounts are all not big, can we do without BigNumber?
let WillContract = artifacts.require("WillContract");


function sm(mes,state) {
    return "The expected " + mes + " is wrong/invalid in state: " + state;
}

function init() {
    var dat = {};
    dat['curFee'] = 0;
    dat['state'] = 1;
    dat['numBene'] = 0;
    dat['misRelease'] = 0;
    dat['nofm'] = 0;
    dat['misBene'] = 0;
    return dat;
}

function copy(inp) {
    var cp = {};
    for (var key in inp) {
        // check if the property/key is defined in the object itself, not in parent
        if (inp.hasOwnProperty(key)) {
            cp[key] = inp[key];
        }
    }
    return cp;
}
function testAll(inp) {
    var cp = copy(inp);
    let st = "State " + cp['state'] + " check: ";
    var txt = st + "should have the right ";
    var its = "current fee: " + cp['curFee'];
    var sm1 = sm(its,cp['state']);
    it(txt + its, async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getReleaseFee();
        assert.equal(val, cp['curFee'], sm1);
    });

    its = "status indicator for OpenforReleaseRequests: " + (cp['state'] == 3);
    var sm2 = sm(its, cp['state']);
    it(txt + its, async function () {
        let instance = await WillContract.deployed();
        let val = await instance.isOpenForRelease();
        assert.equal(val, (cp['state'] == 3), sm2);
    });

    its = "number of registered beneficiaries: " + cp['numBene'];
    var sm3 = sm(its, cp['state']);
    it(txt + its, async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getNumberBeneficiaries();
        assert.equal(val, cp['numBene'], sm3);
    });

    if (cp['state'] < 2) {
        it(st +"should throw error on query for number of missing release requests", async function () {
            let instance = await WillContract.deployed();
            let thrown = false;
            try {
                let val = await instance.getNumberMissingForRelease();
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    } else {
        its = "number of missing release requests: " + cp['misRelease'];
        var sm4 = sm(its, cp['state']);
        it(txt + its, async function () {
            let instance = await WillContract.deployed();
            let val = await instance.getNumberMissingForRelease();
            assert.equal(val, cp['misRelease'], sm4);
        });
    }

    if (cp['state'] < 2) {
        it(st + "should throw error on query for number of missing beneficiaries", async function () {
            let instance = await WillContract.deployed();
            let thrown = false;
            try {
                let val = await instance.getNumberMissingBeneficiaries();
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    } else {
        its = "number of missing beneficiaries to start release: " + cp['misBene'];
        var sm4 = sm(its, cp['state']);
        it(txt + its, async function () {
            let instance = await WillContract.deployed();
            let val = await instance.getNumberMissingBeneficiaries();
            assert.equal(val, cp['misBene'], sm4);
        });
    }

    if (cp['state'] < 2) {
        it(st +"should throw error on trying to register beneficiaries", async function () {
            let instance = await WillContract.deployed();
            let thrown = false;
            try {
                let val = await instance.registerBeneficiary();
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    }

    if (cp['state'] < 2) {
        it(st +"should throw error on trying see the missing number of beneficiaries", async function () {
            let instance = await WillContract.deployed();
            let thrown = false;
            try {
                let val = await instance.getNumberMissingForRelease();
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    }

    if (cp['state'] != 2) {
        it(st +"should throw error on trying to enable release requests", async function () {
            let instance = await WillContract.deployed();
            let thrown = false;
            try {
                let val = await instance.enable();
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    }

    if (cp['state'] >= 5) {
        it(st +"should throw error on trying to reset all", async function () {
            let instance = await WillContract.deployed();
            let thrown = false;
            try {
                let val = await instance.reset();
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    }

    if (cp['state'] != 3) {
        it(st +"should throw error on trying to request release", async function () {
            let instance = await WillContract.deployed();
            let thrown = false;
            try {
                let val = await instance.releaseFor();
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    }
}

function setFee(dat) {
    // set a standard fee for all tests
    dat['curFee'] = 10000;
}

function setParams(dat, n_of_m) {
    dat['nofm'] = n_of_m;
    setFee(dat);
    it("set params", async function () {
        let instance = await WillContract.deployed();
        await instance.setCriteria(dat['curFee'], dat['nofm']);

        let val = await instance.getReleaseFee();
        assert.equal(val, dat['curFee'], "Invalid fee:" + val);
    });
}

function checkRefCode() {
    it("should have a refCode of 0x124", async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getReferenceCode();
        // set 0x124 or other refCode in 2_WillContact migration script!
        assert.equal(val, 0x124, "Invalid refCode:" + val);
    });
}

contract('Check correct initial state', function (accounts) {
    var dat = init();
    testAll(dat);
    checkRefCode();
});

contract('Set parameters and check correct state', function (accounts) {
    var dat = init();
    setParams(dat,1);
    var cpx = copy(dat);
    cpx['state'] = 2;
    cpx['misRelease'] = 1;
    cpx['misBene'] = 1;
    testAll(cpx);
});

contract('Ensure only owner can change parameters', function (accounts) {
    var dat = init();
    dat['nofm'] = 1;
    setFee(dat);
    it("should fail to set params", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.setCriteria(dat['curFee'], dat['nofm'], { from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
        let val = await instance.getReleaseFee();
        assert.equal(val, 0, "Invalid fee: " + val);
    });
    testAll(init());
    checkRefCode();
});

contract('Ensure no one can change parameters', function (accounts) {
    var dat = init();
    dat['nofm'] = 1;
    setFee(dat);
    it("should set params only once", async function () {
        let instance = await WillContract.deployed();
        await instance.setCriteria(dat['curFee'], dat['nofm']);
        let val = await instance.getReleaseFee();
        assert.equal(val, dat['curFee'], "Invalid fee: " + val);

        let thrown = false;
        try {
            await instance.setCriteria(dat['curFee']+1, dat['nofm']);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);

        thrown = false;
        try {
            await instance.setCriteria(dat['curFee'], dat['nofm']+1);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);

        let val2 = await instance.getReleaseFee();
        assert.equal(val2, dat['curFee'], "Invalid fee: " + val2);
    });
    var cpx = copy(dat);
    cpx['state'] = 2;
    cpx['misRelease'] = 1;
    cpx['misBene'] = 1;
    testAll(cpx);
    checkRefCode();
});

contract('Register 1 beneficiary for immediate release', function (accounts) {
    var dat = init();
    setParams(dat,1);
    var cpx = copy(dat);
    cpx['state'] = 2;
    it("register a beneficiary", async function () {
        let instance = await WillContract.deployed();
        await instance.registerBeneficiary(accounts[1]);
    });
    var cpx2 = copy(cpx);
    cpx['misRelease'] = 1;
    cpx['misBene'] = 0;
    cpx['numBene'] = 1;
    testAll(cpx);
});

contract('Owner may be a beneficiary as well', function (accounts) {
    var dat = init();
    setParams(dat,1);
    var cpx = copy(dat);
    cpx['state'] = 2;
    it("register a beneficiary", async function () {
        let instance = await WillContract.deployed();
        await instance.registerBeneficiary(accounts[0]);
    });
    var cpx2 = copy(cpx);
    cpx['misRelease'] = 1;
    cpx['misBene'] = 0;
    cpx['numBene'] = 1;
    testAll(cpx);
});

contract('Ensure only owner can register beneficiaries ', function (accounts) {
    var dat = init();
    setParams(dat,1);
    var cpx = copy(dat);
    cpx['state'] = 2;
    it("should fail to register a beneficiary from non-owner", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.registerBeneficiary(accounts[0], { from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
        thrown = false;
        try {
            await instance.registerBeneficiary(accounts[1], { from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
        
    });
    var cpx2 = copy(cpx);
    cpx['misRelease'] = 1;
    cpx['misBene'] = 1;
    cpx['numBene'] = 0;
    testAll(cpx);
});

function registerN(accounts,numBene,nofm) {
    var dat = init();
    setParams(dat,nofm);
    var cpx = copy(dat);
    cpx['state'] = 2;
    it("register " + numBene+" beneficiaries", async function () {
        let instance = await WillContract.deployed();
        // we assume enough accounts exist, if not the test fails anyway, so no need to check
        for (var idx = 0; idx < numBene; idx++) {
            await instance.registerBeneficiary(accounts[idx]);
        }
    });
    var cpx2 = copy(cpx);
    cpx['misRelease'] = nofm;
    cpx['misBene'] = nofm - numBene;
    if (cpx['misBene'] < 0) {
        cpx['misBene'] = 0;
    }
    cpx['numBene'] = numBene;
    testAll(cpx);
    return cpx;
}

contract('Can add more than minimum beneficiary needed 2:1', function (accounts) {
    registerN(accounts,2,1);
});

contract('Cannot register beneficiary twice', function (accounts) {
    registerN(accounts, 2, 1);
    it("should fail to register same beneficiary again", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.registerBeneficiary(accounts[1]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);

        thrown = false;
        try {
            await instance.registerBeneficiary(accounts[0]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

});

contract('Check that system reset works after registering 2:1 and then register 5:3', function (accounts) {
    registerN(accounts, 2, 1);
    it("should set all to zero", async function () {
        let instance = await WillContract.deployed();
        await instance.reset();
    });
    testAll(init());
    registerN(accounts, 5, 3);
    checkRefCode();
});

contract('Enabling is possible 2:1', function (accounts) {
    var dat = registerN(accounts, 2, 1);
    it("should enable releasing", async function () {
        let instance = await WillContract.deployed();
        await instance.enable();
    });
    var cpx = copy(dat);
    cpx['state'] = 3;
    testAll(cpx);
});

contract('Cannot register anymore after enabling, both new and old', function (accounts) {
    var dat = registerN(accounts, 2, 1);
    it("should enable releasing", async function () {
        let instance = await WillContract.deployed();
        await instance.enable();
    });
    var cpx = copy(dat);
    cpx['state'] = 3;
    testAll(cpx);
    it("should fail to register a new beneficiary", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.registerBeneficiary(accounts[2]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should fail to register an existing beneficiary", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.registerBeneficiary(accounts[1]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
});

contract('Enabling is still possible for 2:1 after blocking 1', function (accounts) {
    var dat = registerN(accounts, 2, 1);
    it("should block a registered-only beneficiary", async function () {
        let instance = await WillContract.deployed();
        await instance.blockBeneficiary(accounts[1]);
    });
    it("should enable releasing", async function () {
        let instance = await WillContract.deployed();
        await instance.enable();
    });
    var cpx = copy(dat);
    cpx['state'] = 3;
    cpx['numBene'] = 1;
    testAll(cpx);
});

contract('Enabling is not possible for 2:1 after blocking 2, even trying to re-enable 1 fails, after all register and enable work again', function (accounts) {
    var dat = registerN(accounts, 2, 1);
    it("should block all registered beneficiary and not allow re-registering any", async function () {
        let instance = await WillContract.deployed();
        await instance.blockBeneficiary(accounts[1]);
        await instance.blockBeneficiary(accounts[0]);
        let thrown = false;
        try {
            await instance.registerBeneficiary(accounts[1]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
        thrown = false;
        try {
            await instance.registerBeneficiary(accounts[0]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not allow to enable releasing", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.enable();
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
        
    });
    var cpx = copy(dat);
    cpx['state'] = 2;
    cpx['numBene'] = 0;
    cpx['misBene'] = 1;
    testAll(cpx);
    it("should still register a new beneficiaries", async function () {
        let instance = await WillContract.deployed();
        await instance.registerBeneficiary(accounts[2]);
    });
    var cpx2 = copy(cpx);
    cpx2['state'] = 2;
    cpx2['numBene'] = 1;
    cpx2['misBene'] = 0;
    testAll(cpx2);
    it("should now still enable releasing", async function () {
        let instance = await WillContract.deployed();
        await instance.enable();
    });
    var cpx3 = copy(cpx2);
    cpx3['state'] = 3;
    testAll(cpx3);
});

