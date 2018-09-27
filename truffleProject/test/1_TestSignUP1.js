// TODO as the amounts are all not big, can we do without BigNumber?
let WillContract = artifacts.require("WillContract");
let rCode = 0x124;
var watcherAddress = 0;
var watcherKey = 0x321;
var docHash = 0x9876


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
                let val = await instance.releaseFor({ value: cp['curFee'], from: accounts[1] });
            } catch (e) {
                thrown = true;
            }
            assert.isTrue(thrown);
        });
    }
}

function setFee(dat) {
    // set a standard fee for all tests
    dat['curFee'] = 1234234;
}

function setParams(dat, n_of_m) {
    dat['nofm'] = n_of_m;
    setFee(dat);
    it("set params", async function () {
        let instance = await WillContract.deployed();
        await instance.setCriteria(dat['curFee'], dat['nofm'], watcherAddress,docHash);

        let val = await instance.getReleaseFee();
        assert.equal(val, dat['curFee'], "Invalid fee:" + val);

        let val2 = await instance.getReferenceHash();
        assert.equal(val2, docHash, "Invalid docHash:" + val2);
    });
}

function checkRefCode() {
    it("should have a refCode of "+ rCode, async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getReferenceCode();
        // set 0x124 or other refCode in 2_WillContact migration script!
        assert.equal(val, rCode, "Invalid refCode:" + val);
    });
}

contract('Check correct initial state and allocate watcherAddress', function (accounts) {
    watcherAddress = accounts[9];
    it("should have a refCode of " + rCode, async function () {
        let instance = await WillContract.deployed();
        console.log(instance.address);
    });
    var dat = init();
    testAll(dat);
    it("should have a refCode of " + rCode, async function () {
        let instance = await WillContract.deployed();
        console.log(instance.address);
    });
    checkRefCode();
});

contract('Set parameters and check correct state', function (accounts) {
    it("should have a refCode of " + rCode, async function () {
        let instance = await WillContract.deployed();
        console.log(instance.address);
    });
    var dat = init();
    setParams(dat,1);
    var cpx = copy(dat);
    cpx['state'] = 2;
    cpx['misRelease'] = 1;
    cpx['misBene'] = 1;
    testAll(cpx);
});

contract('Incorrect parameters', function (accounts) {
    var dat = init();
    dat['nofm'] = 11;
    setFee(dat);
    it("should fail to set 11 n_of_m", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.setCriteria(dat['curFee'], dat['nofm'], watcherAddress,docHash);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    var dat2 = init();
    dat2['nofm'] = 1;
    it("should fail to set zero a watcher", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.setCriteria(dat2['curFee'], dat2['nofm'], 0x00,docHash);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
});

contract('Ensure only owner can change parameters', function (accounts) {
    var dat = init();
    dat['nofm'] = 1;
    setFee(dat);
    it("should fail to set params", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.setCriteria(dat['curFee'], dat['nofm'], watcherAddress, docHash,{ from: accounts[1] });
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
        await instance.setCriteria(dat['curFee'], dat['nofm'], watcherAddress,docHash);
        let val = await instance.getReleaseFee();
        assert.equal(val, dat['curFee'], "Invalid fee: " + val);

        let thrown = false;
        try {
            await instance.setCriteria(dat['curFee'] + 1, dat['nofm'], watcherAddress,docHash);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);

        thrown = false;
        try {
            await instance.setCriteria(dat['curFee'], dat['nofm'] + 1, watcherAddress,docHash);
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

contract('Register 1 beneficiary for immediate release, fail zero address', function (accounts) {
    var dat = init();
    setParams(dat,1);
    var cpx = copy(dat);
    cpx['state'] = 2;
    it("register a beneficiary", async function () {
        let instance = await WillContract.deployed();
        await instance.registerBeneficiary(accounts[1]);
    });
    it("should reject zero address without chaning state", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.registerBeneficiary(0x0);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
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
    it("should not allow non-owner to reset, even if registered", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.reset({ from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not allow non-owner to reset, even if watcher", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.reset({ from: watcherAddress });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow non-owner to reset, even if 0", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.reset({ from: address(0) });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should set all to zero", async function () {
        let instance = await WillContract.deployed();
        await instance.reset();
    });
    testAll(init());
    registerN(accounts, 5, 3);
    checkRefCode();
});

contract('Enabling is possible, try 2:1, but dont allow anyone else than owner ', function (accounts) {
    var dat = registerN(accounts, 2, 1);
    it("should not allow non-owner to enable, even if registered", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.enable({ from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not allow non-owner to enable, even if watcher", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.enable({ from: watcherAddress });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow non-owner to enable, even if 0", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.enable({ from: address(0) });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should throw error on trying to request release before release enabled", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            let val = await instance.releaseFor({ value: dat['curFee'], from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should enable releasing", async function () {
        let instance = await WillContract.deployed();
        await instance.enable();
    });

    it("should throw error on trying to request release for non-permitted beneficiar", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            let val = await instance.releaseFor({ value: dat['curFee'], from: accounts[3] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
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
    it("should not allow non-owner to block, even if registered", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.blockBeneficiary(accounts[1],{ from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not allow non-owner to block, even if watcher", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.blockBeneficiary(accounts[1],{ from: watcherAddress });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow non-owner to block, even if 0", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.blockBeneficiary(accounts[1],{ from: address(0) });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow address to be blocked twice", async function () {
        let instance = await WillContract.deployed();
        await instance.blockBeneficiary(accounts[1]);
        let thrown = false;
        try {
            await instance.blockBeneficiary(accounts[1]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow non-registered address or zero address to be blocked", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.blockBeneficiary(accounts[5]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
        thrown = false;
        try {
            await instance.blockBeneficiary(address(0));
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should block all registered beneficiary and not allow re-registering any", async function () {
        let instance = await WillContract.deployed();
        //done above in porevious case!await instance.blockBeneficiary(accounts[1]);
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

contract('Enabling 2:1 and then have one request release', function (accounts) {
    var dat = registerN(accounts, 2, 1);
    it("should enable releasing", async function () {
        let instance = await WillContract.deployed();
        await instance.enable();
    });
    var cpx = copy(dat);
    cpx['state'] = 3;
    testAll(cpx);
    it("should not allow watcher to set key before quota reached", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey, { from: watcherAddress });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not release and trigger event for fee not reached", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.releaseFor({ value: cpx['curFee']-1, from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should release and trigger event", async function () {
        let instance = await WillContract.deployed();
        // Subscribe to a Solidity event
        console.log(instance.address);
        instance.ReleaseRequestsCompleted({}).watch((error, result) => {
            console.log("event caught: verify owner address and refCode");
            if (error) {
                console.log(error);
            }
            // Once the event is triggered, store the result in the
            // external variable
            console.log("Event data: " + result.args.id + " and " + result.args.ref);
            assert.equal(result.args.id, accounts[0], "Invalid owner address in event");
            assert.equal(result.args.ref, rCode, "Invalid refCode returned");
        });
        await instance.releaseFor({ value: cpx['curFee'], from: accounts[1] });
    });
    it("should not allow blocking anymore, as state is active", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.blockBeneficiary(accounts[1]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    var cpx2 = copy(cpx);
    cpx2['state'] = 5;
    cpx2['numBene'] = 2;
    cpx2['misBene'] = 0;
    cpx2['misRelease'] = 0;
    testAll(cpx2);
    it("should not allow non-watcher to set key, even if registered", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey, { from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not allow non-watcher to set key, even if owner", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow non-watcher to block, even if 0", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey, { from: address(0) });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow key to be zero", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(0x0, { from: watcherAddress });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should set the secret value and have the right watcherKey", async function () {
        web3.eth.getBalance(watcherAddress, function (err, res) {
            console.log("Watcher balance:"+res.toString(10)); 
        });
        let instance = await WillContract.deployed();
        await instance.submitKey(watcherKey, { from: watcherAddress });
        web3.eth.getBalance(watcherAddress, function (err, res) {
            console.log("Watcher balance:"+res.toString(10)); 
        });
        let val = await instance.getKey();
        assert.equal(val, watcherKey, "Invalid watcher key returned");
        web3.eth.getBalance(watcherAddress, function (err, res) {
            console.log("Watcher balance same as view has no cost:" +res.toString(10)); 
        });
    });

});

contract('Enabling 3:2 and then have two request release', function (accounts) {
    var dat = registerN(accounts, 3, 2);
    it("should enable releasing", async function () {
        let instance = await WillContract.deployed();
        await instance.enable();
    });
    it("should have two missing beneficiary request", async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getNumberMissingForRelease();
        assert.equal(val, 2, "Wrong number of missing for release");
    });
    var cpx = copy(dat);
    cpx['state'] = 3;
    testAll(cpx);
    it("should not allow watcher to set key before quota reached", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey, { from: watcherAddress });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not release and trigger event for fee not reached", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.releaseFor({ value: cpx['curFee'] - 1, from: accounts[2] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should release on", async function () {
        let instance = await WillContract.deployed();
        await instance.releaseFor({ value: cpx['curFee'], from: accounts[1] });
    });
    it("should have one missing beneficiary request", async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getNumberMissingForRelease();
        assert.equal(val, 1, "Wrong number of missing for release");
    });
    it("should release and trigger event", async function () {
        let instance = await WillContract.deployed();
        // Subscribe to a Solidity event
        instance.ReleaseRequestsCompleted({}).watch((error, result) => {
            console.log("event caught: verify owner address and refCode");
            if (error) {
                console.log(error);
            }
            // Once the event is triggered, store the result in the
            // external variable
            console.log("Event data: " + result.args.id + " and " + result.args.ref);
            assert.equal(result.args.id, accounts[0], "Invalid owner address in event");
            assert.equal(result.args.ref, rCode, "Invalid refCode returned");
        });
        await instance.releaseFor({ value: cpx['curFee'], from: accounts[2] });
    });
    it("should have one missing beneficiary request", async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getNumberMissingForRelease();
        assert.equal(val, 0, "Wrong number of missing for release");
    });
    it("should not allow blocking anymore, as state is active", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.blockBeneficiary(accounts[1]);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    var cpx2 = copy(cpx);
    cpx2['state'] = 5;
    cpx2['numBene'] = 3;
    cpx2['misBene'] = 0;
    cpx2['misRelease'] = 0;
    testAll(cpx2);
    it("should not allow non-watcher to set key, even if registered", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey, { from: accounts[1] });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should not allow non-watcher to set key, even if owner", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey);
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow non-watcher to block, even if 0", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(watcherKey, { from: address(0) });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });

    it("should not allow key to be zero", async function () {
        let instance = await WillContract.deployed();
        let thrown = false;
        try {
            await instance.submitKey(0x0, { from: watcherAddress });
        } catch (e) {
            thrown = true;
        }
        assert.isTrue(thrown);
    });
    it("should set the secret value and have the right watcherKey", async function () {
        web3.eth.getBalance(watcherAddress, function (err, res) {
            console.log("Watcher balance:" + res.toString(10));
        });
        let instance = await WillContract.deployed();
        await instance.submitKey(watcherKey, { from: watcherAddress });
        web3.eth.getBalance(watcherAddress, function (err, res) {
            console.log("Watcher balance:" + res.toString(10));
        });
        let val = await instance.getKey();
        assert.equal(val, watcherKey, "Invalid watcher key returned");
        web3.eth.getBalance(watcherAddress, function (err, res) {
            console.log("Watcher balance same as view has no cost:" + res.toString(10));
        });
    });

});

