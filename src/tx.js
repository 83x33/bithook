// bitcoinjs doc on scripts https://github.com/bitcoinjs/bitcoinjs-lib/blob/1157856ab05a676b310c0f0c65edf881b5b46849/src/templates/index.js
import bjs, { Transaction, networks, address as Address, script as Script, payments as Payments, crypto, ECPair } from 'bitcoinjs-lib'
// import Address from './address'
// import { Scale } from './lib/Prices'


const Tx = Transaction
export default Tx


Tx.prototype.vanilla = function(){
  return {
      hash: this.getId()
    , ins: this.ins.length
    , outs: this.outs.length
    , amount: 0 // to implement
  }
}

Tx.prototype.dump = function(){
  const decoded = {
      hash: this.getId()
    , ins: this.findInputs()
    , outs: this.findOutputs()
    , outs_satoshis: this.getOutputsTotal()
  }

  // decoded.outs_btc = Scale.satoshis2btc(decoded.outs_satoshis)

  return decoded 
}

// return total sats of outputs
Tx.prototype.getOutputsTotal = function() {
  return this.outs.reduce((acc, o) => acc + o.value, 0)
}

Tx.prototype.findOutputs = function(options){
  return this.find('outputs', options)
}

Tx.prototype.findInputs = function(options){
  return this.find('inputs', options)
}

Tx.prototype.find = function(type, { addresses, amounts, network = 'mainnet', hydrate = false } = {}){
  // filters
  addresses = typeof addresses == 'string' ? [addresses] : addresses || []
  amounts = typeof amounts == 'number' ? [amounts] : amounts || []

  const txhash = this.getId()
  const proxy = {
      outputs: parseOutput
    , inputs: parseInput
  }

  return this[type=='outputs'?'outs':'ins'].reduce((acc, el) => {
    const item = proxy[type](el, { network })
    item.index = acc.index
    if(hydrate) item.txhash = txhash
    
    if(
         (!addresses.length && !amounts.length) 
      || (addresses.length && addresses.includes(item.address))
      || (amounts.length && amounts.includes(item.satoshis))
    ) acc.result.push(item)

    acc.index++
    return acc
  }, { index: 0, result: [] }).result
}



const parseOutput = (el, { network = 'mainnet' } = {}) => {
  network = network == 'testnet' ? networks.testnet : null

  try {
    if(Script.toASM(el.script).substr(0,9) == 'OP_RETURN') 
      throw Error('OP_RETURN input (burned utxo)')

    const output = {
        satoshis: el.value
      , address: Address.fromOutputScript(el.script, network).toString()
    }

    return output

  }catch(e){ 
    return { error: 'cannot parse output' }
    console.log('cannot parse output')
  }
}
 
// Public keys are either the first 65 bytes (130 hex characters) 
// of a scriptPubKey or the last 65 bytes of a scriptSig.

const parseInput = (el, { network = 'mainnet' } = {}) => {
  network = network == 'testnet' ? networks.testnet : null
  try {

    throw 'TODO: input parsing not yet implemented'

    // const chunks = Script.decompile(el.script)

    // const input = {
    //     // satoshis: fetch from previous utxo
    //     address: ''
    //   // , scriptSig: {
    //   //       asm: Script.toASM(el.script)
    //   //     , hex: el.script.toString('hex')
    //   //     // , type: Script.classifyInput(el.script)
    //   //   }
    // }

    // const a = Buffer.from(el.hash).reverse().toString('hex')
    // const b = Payments.p2pkh({ input: el.hash, network })
    // console.log('input', b)

    // switch(input.scriptSig.type){
    //   case 'pubkeyhash':
    //     input.address = ECPair.fromPublicKeyBuffer(chunks[1], network).getAddress()
    //     break
    //   case 'scripthash':
    //     input.address = Address.toBase58Check(
    //         crypto.hash160(chunks[chunks.length - 1])
    //       , networks.bitcoin.scriptHash
    //     )
    //     break
    // }

    return input

  }catch(e){ 
    return { error: 'cannot parse input' }
    console.log('cannot parse input', e)
  }
}




