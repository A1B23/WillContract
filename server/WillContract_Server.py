import json
from flask import Flask, request, jsonify, render_template
from web3 import Web3
from solc import compile_source

w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
#w3.eth.defaultAccount = w3.eth.accounts[0]... was used only for initial testing


app = Flask(__name__)

# standard erro rmessage reply
def err(mes):
    return jsonify({"Error":mes}), 400


# while not usual, but if shortened hex is provided, make it to expected length
def convert(data, length):
    if data[:2] == "0x":
        data = data[2:]
    if len(data) > length:
        data = data[:length]
    else:
        data = data.rjust(length, '0')
    if data[:2] != "0x":
        data = "0x"+data
    return data


# Read the interface data from the local file
# These two files must be shared by the owner to the users and the repository
# As none of them is condifential, they can be sent by mails etc.
def getInterface(refCode):
    refCode1 = convert(refCode, 32)
    json_data = open(refCode1 + "_abi.json").read()
    abi = json.loads(json_data)
    with open(refCode1 + "_address.dat", "r") as infile:
        addr = infile.read()

    return abi, addr


# api to set new user every api call

# Curerently all three functions are provided in one GUI
# this could be split our into a main fucntion and three separate GUIs
@app.route("/", methods=['GET'])
def index():
    return render_template("WillContract.html")


# This deploys the contract, it assumes the owner has the sol-file in the expected
# path, and the address file and the abi file are then generated and stored so that
# the owner can share it with users and repository
@app.route("/deploy/<address>/<refCode>", methods=['GET'])
def deploy(address, refCode):
    try:
        try:
            address = w3.toChecksumAddress(address)
            refCode1 = convert(refCode, 32)
            refCode = int(refCode1, 16)
        except Exception:
            return err("Invalid address parameter")
        # Solidity source code, compile it with local compiler
        with open("../truffleproject/contracts/WillContract.sol", "r") as con:
            contract_source_code = con.read()
        compiled_sol = compile_source(contract_source_code)  # Compiled source code
        contract_interface = compiled_sol['<stdin>:WillContract']

        # Instantiate and deploy contract
        # deploy_contract(contract_interface):
        contract = w3.eth.contract(
            abi=contract_interface['abi'],
            bytecode=contract_interface['bin']
        )

        try:
            tx_hash = contract.constructor(refCode).transact({'from': address})
            # Get tx receipt to get contract address
            tx_receipt = w3.eth.getTransactionReceipt(tx_hash)
        except Exception:
            return err("TX failed, is the address correct? "+address)

        # Remember the settings in a file, these are public info
        with open(refCode1+"_abi.json", "w") as outfile:
            json.dump(contract_interface['abi'], outfile)
        with open(refCode1+"_address.dat", "w") as outfile:
            outfile.write(str(tx_receipt['contractAddress']))

        return jsonify({"ContractAddress": str(tx_receipt['contractAddress']),
            "Block-No": str(tx_receipt['blockNumber']),
            "TX-Hash":  str(Web3.toHex(tx_receipt['transactionHash'])),
            "TX-Index": str(tx_receipt['transactionIndex'])}), 200
    except Exception:
        return err('Deployment failed, contact admin')


# This is a general query functions controlled by keyuwords
# All calls here are to view functions and don't need transaction
# so they don't have the sender address, only the contract refCode is needed
# the reply is adjusted to be hex where typically hex values are used
@app.route("/query/<refCode>/<qtype>", methods=['GET'])
def query(refCode, qtype):
    try:
        abi, addr = getInterface(refCode)
        contract_instance = w3.eth.contract(address=addr, abi=abi)
    except Exception:
        return err("No contract found")
    ret = "n/a"
    try:
        if qtype == "fee":
            ret = str(contract_instance.functions.getReleaseFee().call())
        elif qtype == "refCode":
            ret = str(hex(contract_instance.functions.getReferenceCode().call()))
        elif qtype == "numUser":
            ret = str(contract_instance.functions.getNumberBeneficiaries().call())
        elif qtype == "hash":
            ret = str(hex(contract_instance.functions.getReferenceHash().call()))
        elif qtype == "enabled":
            ret = str(contract_instance.functions.isOpenForRelease().call())
        elif qtype == "key":
            ret = str(hex(contract_instance.functions.getKey().call()))
        elif qtype == "nofm":
            ret = str(contract_instance.functions.getNumberMissingBeneficiaries().call())
        elif qtype == "misRel":
            ret = str(contract_instance.functions.getNumberMissingForRelease().call())
        return jsonify({qtype: ret})
    except Exception:
        return err("Query failed, no refCode or invalid contract state")

# This routine sets the contract parameters by the owner,
# it is the only POST function so far. Parameters can only
# be set once, unless there was a contract reset
@app.route("/criteria/<address>/<refCode>", methods=['POST'])
def setCriteria(address, refCode):
    try:
        try:
            val = request.get_json()
        except Exception:
            return err("JSON not decodeable")
        try:
            abi, addr = getInterface(refCode)
            contract_instance = w3.eth.contract(address=addr, abi=abi)
        except Exception:
            return err("No contract found")
        try:
            hash = int(convert(val['hash'], 64),16)
            fee = int(val['fee'])
            quor = int(val['quorum'])
            feeDest = w3.toChecksumAddress(val['feeDest'])
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.setCriteria(fee, quor, feeDest, hash).transact({'from': address})
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"TXHash": Web3.toHex(tx_hash)})
    except Exception:
        return err("Setting criteria failed")

# This routine enables the users to make release requests
# it must be called after the users are registered
@app.route("/enable/<address>/<refCode>", methods=['GET'])
def enable(address, refCode):
    try:
        try:
            abi, addr = getInterface(refCode)
            contract_instance = w3.eth.contract(address=addr, abi=abi)
        except Exception:
            return err("No contract found")
        try:
            address = w3.toChecksumAddress(address)
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.enable().transact({'from': address})
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"TXHash": Web3.toHex(tx_hash)}), 200
    except Exception:
        return err("Enabling failed, n-of-m not reached, check missing registration and enabled status")

# This function allows the owner to reset the parameters of the contract
# It resets the state back to as it was right after deployment
@app.route("/reset/<address>/<refCode>", methods=['GET'])
def reset(address, refCode):
    try:
        try:
            abi, addr = getInterface(refCode)
            contract_instance = w3.eth.contract(address=addr, abi=abi)
        except Exception:
            return err("No contract found")
        try:
            address = w3.toChecksumAddress(address)
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.reset().transact({'from': address})
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"TXHash": Web3.toHex(tx_hash)}), 200
    except Exception:
        return err("Reset failed, keys got released already.")

# This is used by registered users, who want to make a release request
# As the release is the paying function for the repoistory, the
# user must also provide the amount of Wei to be paid
@app.route("/release/<address>/<refCode>/<fee>", methods=['GET'])
def release(address, refCode, fee):
    try:
        try:
            abi, addr = getInterface(refCode)
            contract_instance = w3.eth.contract(address=addr, abi=abi)
        except Exception:
            return err("No contract found")
        try:
            address = w3.toChecksumAddress(address)
            fee = int(fee)
            fee = w3.toWei(fee, 'Wei')
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.releaseFor().transact({'from': address, 'value': fee, 'gas': 200000})
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"TXHash": Web3.toHex(tx_hash)}), 200
    except Exception:
        return err("Release failed, provided enough ether?")

# This is called by the repository after it detects (or is alerted) of the event
# The event is raised when enough release requests have been made.
# By releasing the key, the repository gets the total of fees transferred
@app.route("/key/<address>/<refCode>/<key>", methods=['GET'])
def releaseKey(address, refCode, key):
    try:
        try:
            abi, addr = getInterface(refCode)
            contract_instance = w3.eth.contract(address=addr, abi=abi)
        except Exception:
            return err("No contract found")
        try:
            address = w3.toChecksumAddress(address)
            key = int(convert(key,32),16)
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.submitKey(key).transact({'from': address})
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"TXHash": Web3.toHex(tx_hash)}), 200
    except Exception:
        return err("Release failed, provided enough ether?")


# This routine is used by the owner to register users
# the users are registered by their account address, which they later
# must use to make release requests
@app.route("/register/<address>/<refCode>/<user>", methods=['GET'])
def register(address, refCode, user):
    try:
        try:
            abi, addr = getInterface(refCode)
            contract_instance = w3.eth.contract(address=addr, abi=abi)
        except Exception:
            return err("No contract found")
        try:
            address = w3.toChecksumAddress(address)
            user = w3.toChecksumAddress(user)
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.registerBeneficiary(user).transact({'from': address})
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"TXHash": Web3.toHex(tx_hash)}), 200
    except Exception:
        return err("Registration failed, address is already registered, or contract closed?")


# This routine is used by the owner to block already registered users
# the users are registered by their account address, which is used here to block them
@app.route("/block/<address>/<refCode>/<user>", methods=['GET'])
def block(address, refCode, user):
    try:
        try:
            abi, addr = getInterface(refCode)
            contract_instance = w3.eth.contract(address=addr, abi=abi)
        except Exception:
            return err("No contract found")
        try:
            address = w3.toChecksumAddress(address)
            user = w3.toChecksumAddress(user)
        except Exception:
            return err("Invalid address parameter")
        tx_hash = contract_instance.functions.blockBeneficiary(user).transact({'from': address})
        receipt = w3.eth.waitForTransactionReceipt(tx_hash)
        return jsonify({"TXHash": Web3.toHex(tx_hash)}), 200
    except Exception:
        return err("Blocking user failed, address is not registered")

# This function is ponly or testing with ganache, it provides
# the list of accounts created during the ganache session
@app.route("/debug/<debInfo>", methods=['GET'])
def debug(debInfo):
    ret = []
    for i in range(0,10):
        ret.append(w3.eth.accounts[i])
    return jsonify({"Test accounts": ret}), 200



app.run(host="127.0.0.1", port=5554, threaded=True)