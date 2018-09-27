from web3.providers.rpc import HTTPProvider
from web3 import Web3
from solc import compile_source, compile_files

# Solidity source code
file = open("../truffleproject/contracts/WillContract.sol", "r")
contract_source_code = file.read()
compiled_sol = compile_source(contract_source_code) # Compiled source code
contract_interface = compiled_sol['<stdin>:WillContract']
compiledCode = contract_interface['bin']
compiledCode = '0x'+compiledCode # This is a hack which makes the system work
w3 = Web3(HTTPProvider('http://localhost:8545'))
# set pre-funded account as sender
w3.eth.defaultAccount = w3.eth.accounts[0]

# deploy_contract(contract_interface):
# Instantiate and deploy contract
contract = w3.eth.contract(
    abi=contract_interface['abi'],
    bytecode=contract_interface['bin']
)
# Get transaction hash from deployed contract
tx_hash = contract.constructor(0x123).transact()
print("Contract deployed")
# Get tx receipt to get contract address
tx_receipt = w3.eth.getTransactionReceipt(tx_hash)
print("Contract Address: " + str(tx_receipt['contractAddress']))
print("Block: " + str(tx_receipt['blockNumber']))
print("gasUsed: " + str(tx_receipt['gasUsed']))
print("TXHash: " + str(Web3.toHex(tx_receipt['transactionHash'])))
print("TXIndex: " + str(tx_receipt['transactionIndex']))

contract_address = tx_receipt['contractAddress']

#contract has been deployed, now we need to get the handle to the deployed contract
contract_instance = w3.eth.contract(address=contract_address,abi=contract_interface['abi'])


print("refCode:" +str(contract_instance.functions.getReferenceCode().call()))
tx_hash = contract_instance.functions.setCriteria(200, 5,w3.eth.accounts[1],0xfefefe).transact()
receipt = w3.eth.waitForTransactionReceipt(tx_hash)
print("fee:" + str(contract_instance.functions.getReleaseFee().call()))
