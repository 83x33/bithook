import url from 'url'
import RPC from 'rpc-client'  


const RPCClient = options => {
  const client = new RPC({ host: options.hostname, port: options.port })
  const auth = options.auth && options.auth.split(':') 
  auth && client.setBasicAuth(auth[0], auth[1])
  return client
}

export default function({ bitcoind, network="mainnnet" }){
  
  const client = RPCClient({  
      ...url.parse(bitcoind)
    , port: url.parse(bitcoind).port || (network == 'mainnnet' ? 8332 : 18332)
  })


  // promisify call method
  client.call_ = client.call
  client.call = (cmd, ...args) => {
    return new Promise((resolve, reject) => {
      client.call_(cmd, args, (err, result) => {
        if(err) reject(err) 
        resolve(result) 
      }) 
    })
  }

  return client  
}