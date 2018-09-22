pragma solidity ^0.4.24;

contract WillContract {
    // This state defines the control by the owner and the progressive
    // stages even if the owner does not act anymore 
    enum State {Undef, Fee, Register, Enabled, ReInit, Active, Completed, Frozen}
    State state = State.Undef;
    
    // This state is registered beneficiary control, they must first
    // be Permitted to contribute by the owner, and can make only one contribution
    enum Beneficiary {Undef, Permitted, Completed} 
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
    
    function enable() public {
        require(msg.sender == owner);
        require(addrBene.length >= minumumRelease);
        state = State.Enabled;
    }
    
    function reset() public {
        require(msg.sender == owner);
        state = State.Fee;
        for (uint idx=0; idx<addrBene.length;idx++) {
            delete benefit[addrBene[idx]];
        }
        delete addrBene;
    }
    
    
    
}