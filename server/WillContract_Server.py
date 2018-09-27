import json
from flask import Flask, request, jsonify, render_template
from web3 import Web3
from web3.providers.rpc import HTTPProvider
from solc import compile_source

# web3.py instance
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
w3.eth.defaultAccount = w3.eth.accounts[0]

# Get stored abi and contract_address
# with open("data.json", 'r') as f:
#     datastore = json.load(f)
#     abi = datastore["abi"]
#     contract_address = datastore["contract_address"]

# Initializing flask app

app = Flask(__name__)
contr = {}


def err(mes):
    return jsonify({"Error":mes}),400

# api to set new user every api call

@app.route("/", methods=['GET'])
def index():
    return render_template("WillContract.html")


@app.route("/deploy/<refCode>", methods=['GET'])
def deploy(refCode):
    try:
        # Solidity source code
        file = open("../truffleproject/contracts/WillContract.sol", "r")
        contract_source_code = file.read()
        compiled_sol = compile_source(contract_source_code)  # Compiled source code
        contract_interface = compiled_sol['<stdin>:WillContract']

        # deploy_contract(contract_interface):
        # Instantiate and deploy contract
        contract = w3.eth.contract(
            abi=contract_interface['abi'],
            bytecode=contract_interface['bin']
        )

        # Get transaction hash from deployed contract
        tx_hash = contract.constructor(0x123).transact()
        # Get tx receipt to get contract address
        tx_receipt = w3.eth.getTransactionReceipt(tx_hash)
        contr.update({"abi": contract_interface['abi'], "address":tx_receipt['contractAddress']})

        return jsonify({"ContractAddress": str(tx_receipt['contractAddress']),
            "Block": str(tx_receipt['blockNumber']),
            "TXHash":  str(Web3.toHex(tx_receipt['transactionHash'])),
            "TXIndex": str(tx_receipt['transactionIndex'])}), 200
    except Exception:
        return err('Deployment failed, contact admin')

@app.route("/query/<refCode>", methods=['GET'])
def query(refCode):
    try:
        contract_instance = w3.eth.contract(address=contr["address"], abi=contr['abi'])
    except Exception:
        return err("No contract found")
    ret = "n/a"
    if refCode == "fee":
        ret = str(contract_instance.functions.getReleaseFee().call())
    elif refCode == "refCode":
        ret = str(contract_instance.functions.getReferenceCode().call())
    elif refCode == "numBene":
        ret = str(contract_instance.functions.getNumberBeneficiaries().call())
    elif refCode == "hash":
        ret = str(hex(contract_instance.functions.getReferenceHash().call()))
    elif refCode == "enabled":
        ret = str(contract_instance.functions.isOpenForRelease().call())
    return jsonify({refCode: ret})

def convert(data,length):
    if data[:2] == "0x":
        data = data[2:]
    if len(data) > length:
        data = data[:length]
    else:
        data = data.rjust(length, '0')
    if data[:2] != "0x":
        data = "0x"+data
    return data

@app.route("/criteria", methods=['POST'])
def setCriteria():
    try:
        try:
            val = request.get_json()
        except Exception:
            return err("JSON not decodeable")
        contract_instance = w3.eth.contract(address=contr["address"], abi=contr['abi'])
        try:
            addr = int(convert(val['feeDest'], 32),16)
            hash = int(convert(val['hash'], 32),16)
            fee = int(val['fee'])
            quor = int(val['quorum'])
            addr = w3.eth.accounts[1]

            addr = w3.toChecksumAddress(addr)
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.setCriteria(fee, quor, addr, hash).transact()
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"reply":Web3.toHex(tx_hash)})
    except Exception:
        return err("Setting criteria failed, probably set already, try to get refCode and see if it is non-zero")

# def user():
#     # Create the contract instance with the newly-deployed address
#     user = w3.eth.contract(address=contract_address, abi=abi)
#     body = request.get_json()
#     result, error = UserSchema().load(body)
#     if error:
#         return jsonify(error), 422
#     tx_hash = user.functions.setUser(
#         result['name'],result['gender']
#     ).transact()
#     # Wait for transaction to be mined...
#     receipt = w3.eth.waitForTransactionReceipt(tx_hash)
#     user_data = user.functions.getUser().call()
#     return jsonify({"data": user_data}), 200

app.run(host="127.0.0.1", port=5554, threaded=True)