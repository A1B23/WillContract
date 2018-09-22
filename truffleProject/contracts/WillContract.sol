pragma solidity ^0.4.24;

contract WillContract {
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
    
    uint minumumRelease = 0;

    
    constructor() public {
        owner = msg.sender;
        state = State.Fee;
    }

    function setCriteria(uint fee, uint8 m_out_of_n) public {
        // there is no need to register the n, as it is the length of the array
        require(state == State.Fee);
        require(msg.sender == owner);
        // zero is allowed if trustd party is charity :-)
        registerFee = fee;
        minumumRelease = m_out_of_n;
        state = State.Register;
    }
    
    function registerBeneficiary(address bene) public {
        require(msg.sender == owner);
        // TODO maybe optimse?
        require(addrBene.length < 255);
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
        return addrBene.length;
    }
    
    function getReleaseFee() public view returns (uint) {
        return registerFee;
    }
    
    function isOpenForRelease() public view returns (bool) {
        return state == State.ForRelease;
    }
    
    // Provide the number of successful/registered release requests
    // which must come from the list of approved beneficiaries only
    function getNumberReleaseRequests() internal view returns (uint) {
        uint cnt=0;
        for(uint idx =0; idx < addrBene.length; idx++) {
            if (addrBene[idx] != 0x00) {
                if (benefit[addrBene[idx]] == Beneficiary.Completed) {
                    cnt++;
                }
            }
        }
        return cnt;
    }
    
    function getNumberMissingForRelease() public view returns (uint) {
        require(state >= State.Register);
        uint cnt = getNumberReleaseRequests();
        if (cnt >= minumumRelease) {
            return 0;
        }
        return minumumRelease-cnt;
    }
    
    function enable() public {
        require(msg.sender == owner);
        require(state == State.Register);
        require(addrBene.length >= minumumRelease);
        state = State.ForRelease;
    }
    
    function reset() public {
        require(msg.sender == owner);
        require(state < State.Active);
        state = State.Fee;
        for (uint idx=0; idx<addrBene.length;idx++) {
            delete benefit[addrBene[idx]];
        }
        delete addrBene;
    }
    
    function blockBeneficiary(address bene) public view returns (bool) {
        require(msg.sender == owner);
        require(state < State.Active);
        require(benefit[bene] < Beneficiary.Completed);
        benefit[bene] < Beneficiary.Blocked;
    }
    
    function releaseFor(address bene) public payable {
        require(state == State.ForRelease);
        require(benefit[bene] == Beneficiary.Permitted);
        benefit[bene] == Beneficiary.Completed;
        uint cnt=getNumberReleaseRequests();
        if (cnt >= minumumRelease) {
            state = State.Active;
            // TODO here we throw the event for the listener!!!
        }
    }
    
    
    
}