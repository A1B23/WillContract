pragma solidity ^0.4.24;

contract WillContract {
    enum State {Register, Enabled, ReInit, Active, Completed, Frozen} 
    uint registerFee = 0;    
    State state;
    uint totalFee = 0;
    address owner;
    
    function WillContract() {
        owner = msg.sender;
        state = State.Register;
    }

    function setFee(uint fee) {
        require(state == State.Register);
        require(msg.sender == owner);
        registerFee = fee;
    }
    
}