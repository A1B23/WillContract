let WillContract = artifacts.require("WillContract");


function sm(mes,state) {
    return "The " + mes + " is wrong/invalid in state: " + state;
}

function init() {
    var dat = {};
    dat['curFee'] = 0;
    dat['state'] = 0;
    dat['noBenef'] = 0;
    dat['curRelRequ'] = 0;
    dat['nofm'] = 0;
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
    var txt = "" + cp['state'] + " " + "should have the right ";
    var its = "current fee: " + cp['curFee'];
    var sm1 = sm(its,cp['state']);
    it(txt + its, async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getReleaseFee();
        assert.equal(val, cp['curFee'], sm1);
    });

    its = "status indicator for OpenforRelease";
    var sm2 = sm(its, cp['state']);
    it(txt + its, async function () {
        let instance = await WillContract.deployed();
        let val = await instance.isOpenForRelease();
        assert.equal(val, (cp['state'] == 3), sm2);
    });

    its = "number of registered beneficiaries: " + cp['noBenef'];
    var sm3 = sm(its, cp['state']);
    it(txt + its, async function () {
        let instance = await WillContract.deployed();
        let val = await instance.getNumberBeneficiaries();
        assert.equal(val, cp['noBenef'], sm3);
    });

    if (cp['state'] < 2) {
        it("" + cp['state'] + " " +"should throw error on query for number of missing release requests", async function () {
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
        its = "number of current release requests: " + cp['curRelRequ'];
        var sm4 = sm(its, cp['state']);
        it(txt + its, async function () {
            let instance = await WillContract.deployed();
            let val = await instance.getNumberMissingForRelease();
            assert.equal(val, cp['curRelRequ'], sm4);
        });
    }

    if (cp['state'] < 2) {
        it("" + cp['state'] + " " +"should throw error on trying to register beneficiaries", async function () {
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
        it("" + cp['state'] + " " +"should throw error on trying see the missing number of beneficiaries", async function () {
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
        it("" + cp['state'] + " " +"should throw error on trying to enable release requests", async function () {
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
        it("" + cp['state'] + " " +"should throw error on trying to reset all", async function () {
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
        it("" + cp['state']   + " " +"should throw error on trying to request release", async function () {
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


contract('WillContract1', function (accounts) {
    var dat = init();
    testAll(dat);
});

contract('WillContract2', function (accounts) {
    var dat = init();
    dat['state'] = 1;
    dat['nofm'] = 1;
    dat['curFee'] = 100;
    it("set params", async function () {
        let instance = await WillContract.deployed();
        await instance.setCriteria(dat['curFee'], dat['nofm']);

        let val = await instance.getReleaseFee();
        assert.equal(val, dat['curFee'], "nag" + val);
    });
    var cpx = copy(dat);
    cpx['state'] = 2;
    cpx['curRelRequ'] = 1;
    testAll(cpx);
});

contract('WillContract3', function (accounts) {
    var dat = init();
    //dat['state'] = 2;
    testAll(dat);
});

contract('WillContract4', function (accounts) {
    var dat = init();
    dat['state'] = 1;
    dat['nofm'] = 1;
    dat['curFee'] = 250;
    it("set params", async function () {
        let instance = await WillContract.deployed();
        await instance.setCriteria(dat['curFee'], dat['nofm']);

        let val = await instance.getReleaseFee();
        assert.equal(val, dat['curFee'], "nag" + val);
    });
    testAll(dat);
});
