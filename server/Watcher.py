import json
from web3.providers.rpc import HTTPProvider
from web3.auto import Web3

import time

w3 = Web3(HTTPProvider('http://localhost:8555'))
# #open("C:/Users/XXX/Documents/50_states.csv",mode='w')
# with open("C:/BlockChainSG/project_blockchain/Will_contract/project/truffleProject/build/contracts/WillContract.json", mode='r') as abi_definition:
#     abi = json.load(abi_definition)
# contractAddress = w3.toChecksumAddress('0xea56736062e3cd7bce48be94830ad112bbaca94f')
# fContract = w33.eth.contract(abi,contractAddress)
# event_signature_transfer = w3.sha3(text='Transfer(address,address,uint256)')
# event_filter = w3.eth.filter('{"topics": [event_signature_transfer]}')
# # transfer_events = w3.eth.getFilterChanges(event_filter.filter_id)
# mycontract ==
# myfilter = mycontract.eventFilter('EventName', {'fromBlock': 0,'toBlock': 'latest'});
# eventlist = myfilter.get_all_entries()


def handle_event(event):
    print(w3.eth.getBlock('latest'))
    block = w3.eth.getBlock('latest')
    print("------------------------------------------")
    for xx in w3.eth.getBlock('latest')['transactions']:
        x=Web3.toHex(xx)
        print("TX: "+x)
        #x=str(xx)[11:]
        #x=x[:-3]
        #print(x)
        #print(Web3.toHex(event))
        print(w3.eth.getTransaction(x))

def log_loop(event_filter, poll_interval):
    while True:
        for event in event_filter.get_new_entries():
            handle_event(event)
        print("sleep")
        time.sleep(poll_interval)


def main():
    block_filter = w3.eth.filter('latest')
    #block_filter = w3.eth.filter({'fromBlock':'latest',"address": w3.toChecksumAddress('0x73cf86ab49135d21c14242f5a577682b47ce6041')})
    #block_filter = w3.eth.filter(fromBlock="latest", argument_filters = {'arg1': 10})
    log_loop(block_filter, 2)

main()

# w3 = Web3(HTTPProvider('http://localhost:8545'))
# contract_address = Web3.toChecksumAddress("0xa293277dcd6f2e98ba63583fb81ed72f7555c8ef")
#
# with open('contract_abi.json', 'r', encoding='utf-8') as abi_file:
#     contract_abi = json.loads(abi_file.read())
#
# my_contract = w3.eth.contract(address=contract_address, abi=contract_abi)
#
# myfilter = my_contract.eventFilter('EventName', {'fromBlock': 0,'toBlock': 'latest'});
# eventlist = myfilter.get_all_entries()
#
# event_filter = my_contract.events.IpfsHash.createFilter(fromBlock='latest')
#
# poll_interval = 2


# def handle_event(event):
#     print("Event triggered")
#
#
# while True:
#     print("New entries: ", len(event_filter.get_new_entries()))
#     for event in event_filter.get_new_entries():
#        handle_event(event)
#     print("Get Hash:", contract.functions.getHash().call())
#     time.sleep(poll_interval)
#
# provider = "https://ropsten.infura.io/pg5TjJcuXZeKoSzSFVNs"
# private_key = "0x7da70870fa28ef9466f1911198409001cd848f9b28a5f817e084f67c106b8a0b"
# accountAddress = "0x2946F35Ea475183b28A33b99e165c21965435Cd5"
# contractAddress = "0xdfE2aCF511740097346368e2dc5cec737a8702C0"
#
# #provider = 'HTTP://127.0.0.1:7545'
# #private_key = "589bc35119cc392ddeab0d69c3bc12548d3332a69afa122766bc26b2b6f9e163"
# #accountAddress="0x97aE03Aa71DD111d964A1ab61940A4f9D8e854B9"
# #contractAddress = "0x1c23D10614cB5E1b85789ACA8388b2F65ff76E79"
#
# w3 = Web3(HTTPProvider(provider))
#
#
#
# myabi = '[{"constant":true, "inputs": [], "name": "count", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "newFact", "type": "string" } ], "name": "add", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "index", "type": "uint256" } ], "name": "getFacxt", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [], "payable": false, "stateMutability": "nonpayable", "type": "constructor" } ]'
# abx = json.loads(myabi)
# contract_instance = w3.eth.contract(address=contractAddress,abi=abx)
#
#
# def add_fact(contract_instance, xprivate_key, accAddress,xfact):
#     nonce = w3.eth.getTransactionCount(accAddress)
#
#     #tx_hash = contract_instance.functions.getFacxt("test").transact()
#     #print(web3.toHex(tx_hash))
#     #nonce = 190
#     add_transaction = contract_instance.functions.add(xfact).buildTransaction(
#         {
#             'gas': 4600000,
#             'nonce': nonce
#         }
#     )
#     print("add_transaction")
#     print(add_transaction)
#     signed_txn = w3.eth.account.signTransaction(add_transaction, private_key=xprivate_key)
#     print("signed_txn")
#     print(signed_txn)
#     ret = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
#     print('\nhttps://ropsten.etherscan.io/tx/{0}'.format(ret.hex()))
#
# fact = "The Chancellor now speaks Python"
# #add_fact(contract_instance,private_key,accountAddress,fact)
#
# def facts_count(contract_instance):
#     count = contract_instance.functions.count().call()
#     print("Count: "+str(count))
#     return count
#
# def get_fact(contract_instance,index):
#     fact = contract_instance.functions.getFacxt(index).call() #misspelling as per contract
#     print(fact)
#
# x = facts_count(contract_instance)
# for idx in range(x):
#     get_fact(contract_instance,idx)
#
#
