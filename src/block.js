import _ from 'lodash'
import { Block } from 'bitcoinjs-lib'



export default Block


Block.prototype.vanilla = function(){
  return {
      hash: this.getId()
    , tx: this.transactions.length
    , size: this.byteLength()
    , ts: this.timestamp
  }
} 
 

Block.prototype.findOutputs = function(options){
  return this.find('outputs', options)
}

Block.prototype.findInputs = function(options){
  return this.find('inputs', options)
}

Block.prototype.find = function(type, options){

  const blockhash = this.getId()
  const ts = this.timestamp
  const proxy = {
      outputs: 'findOutputs'
    , inputs: 'findInputs'
  }


  let items = _.flatten(this.transactions.map((tx, i) => {
    return tx[proxy[type]](options)
  }))

  // appen blockhash & ts
  items = _.map(items, el => {
    if(options.hydrate){
      el.blockhash = blockhash
      el.ts = ts
    }
    return el
  })

  return items
}


// return total sats of outputs
Block.prototype.getOutputsTotal = function() {
  return this.transactions.reduce((acc, tx) => acc + tx.getOutputsTotal(), 0)
}

