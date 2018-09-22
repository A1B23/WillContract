pragma solidity ^0.4.24;

contract WillContract {
    enum State {Register, Enabled, ReInit, Active, Completed, Frozen} 
    State state;
    uint totalFee = 0;
    address owner;
    
    function WillContract() {
        owner = msg.sender;
        state = State.Register;
    }
    
}