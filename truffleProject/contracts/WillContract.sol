pragma solidity ^0.4.24;

contract WillContract {
    
    uint constant maxBene = 100; // this is a hard limit to avoid gas overflow
    uint codeRef = 0;
    
    // This state defines the control by the owner and the progressive
    // stages even if the owner does not act anymore 
    enum State {Undef, Fee, Register, ForRelease, ReInit, Active, Completed, Frozen}
    State state = State.Undef;
    
    // This state is registered beneficiary control, they must first
    // be Permitted to contribute by the owner, and can make only one contribution
    enum Beneficiary {Undef, Permitted, Completed, Blocked} 
    mapping (address => Beneficiary) benefit;
    address [] addrBene;
 
    // This sets the fee which beneficiaries must pay the trusted controller
    // It is outside this contract to resove dispoutes in a m to n case why
    // m beneficiaries pay the fee an dthe other need not
    uint registerFee = 0;    

    // To verify and control the totla amount of fees to the trusted controller
    // it is not necessary to track individual contibutors, only the total sum is needed
    uint totalFee = 0;
    
    // This is the address of the owner who controls the main state
    address owner;
    
    uint8 minumumRelease = 0;

    // the external party knows the owners address, so it monitors for this event
    event ReleaseRequestsCompleted(address indexed id,uint indexed ref);
    
    constructor(uint refCode) public {
        owner = msg.sender;
        require(refCode > 0);
        codeRef = refCode;
        // set initial state to allow only setting of fee an dother parameters
        state = State.Fee;
    }

    function setCriteria(uint fee, uint8 m_out_of_n) public {
        // there is no need to register the n, as it is the length of the array
        require(state == State.Fee);
        require(msg.sender == owner);
        require(m_out_of_n < maxBene);
        // zero is allowed if trustd party is charity :-)
        registerFee = fee;
        minumumRelease = m_out_of_n;
        // the parameters can onlyb eset once, and the next stage begins
        state = State.Register;
    }
    
    function registerBeneficiary(address bene) public {
        require(msg.sender == owner);
        // Set a limit to it
        require(addrBene.length < maxBene);
        // A fee must be set before the first registration, else
        // a quick beneficiary may get through with zero fees after registering here
        require(state == State.Register);
        require(bene != 0x00);
        // Registration is only once, otherwise owner must reset everything
        require(benefit[bene] < Beneficiary.Permitted);
        benefit[bene] = Beneficiary.Permitted;
        addrBene.push(bene);
    }
    
    function getNumberBeneficiaries() public view returns (uint) {
        return getNumberBeneficiaryState(Beneficiary.Completed) + getNumberBeneficiaryState(Beneficiary.Permitted);
    }
    
    function getReferenceCode() public view returns (uint) {
        return codeRef;
    }
    
    function getReleaseFee() public view returns (uint) {
        return registerFee;
    }
    
    function isOpenForRelease() public view returns (bool) {
        return state == State.ForRelease;
    }
    
    // Provide the number of successful/registered release requests
    // which must come from the list of approved beneficiaries only
    function getNumberBeneficiaryState(Beneficiary benState) internal view returns (uint) {
        uint cnt=0;
        for(uint idx =0; idx < addrBene.length; idx++) {
            if (addrBene[idx] != 0x00) {
                if (benefit[addrBene[idx]] == benState) {
                    cnt++;
                }
            }
        }
        return cnt;
    }
    
    // provide the number of missing release request before release is triggered
    function getNumberMissingForRelease() public view returns (uint) {
        //state must be in registration or higher 
        require(state >= State.Register);
        uint cnt = getNumberBeneficiaryState(Beneficiary.Completed);
        if (cnt >= minumumRelease) {
            return 0;
        }
        return minumumRelease-cnt;
    }
    
    // provide the number of missing beneficiary registrations
    function getNumberMissingBeneficiaries() public view returns (uint) {
        require(state >= State.Register);
        uint cnt = getNumberBeneficiaryState(Beneficiary.Permitted);
        if (cnt >= minumumRelease) {
            return 0;
        }
        return minumumRelease-cnt;
    }
    
    // Once enough/all beneficiaries are registered, owner can close
    // registration and enable the release requests
    function enable() public {
        require(msg.sender == owner);
        require(state == State.Register);
        require(getNumberBeneficiaryState(Beneficiary.Permitted) >= minumumRelease);
        state = State.ForRelease;
    }
    
    // Unless the release is over, the owner can reset the entire
    // state to void, e.g. if owner suspects cheating/colluding etc.
    function reset() public {
        require(msg.sender == owner);
        require(state < State.Active);
        state = State.Fee;
        for (uint idx=0; idx<addrBene.length;idx++) {
            delete benefit[addrBene[idx]];
        }
        delete addrBene;
        registerFee = 0;
        minumumRelease = 0;
    }
    
    // Owner may block certain beneficiary/address from further use
    // unless it already registered a release request
    function blockBeneficiary(address bene) public {
        require(msg.sender == owner);
        require(state < State.Active);
        require(benefit[bene] < Beneficiary.Completed);
        benefit[bene] = Beneficiary.Blocked;
    }
    
    // Any registered beneficiary can pay the required fee to register
    // the request for release. When the minimum of such requests is reached
    // an event is triggered to inform the custodian
    function releaseFor() external payable {
        require(state == State.ForRelease);
        require(benefit[msg.sender] == Beneficiary.Permitted);
        benefit[msg.sender] = Beneficiary.Completed;
        uint cnt=getNumberBeneficiaryState(Beneficiary.Completed);
        if (cnt >= minumumRelease) {
            state = State.Active;
            emit ReleaseRequestsCompleted(owner, codeRef);
        }
    }
    
    
    
}