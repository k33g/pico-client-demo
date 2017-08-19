const {Service, Client, DiscoveryBackend} = require('./pico')

/**
 * Backend: http://pico.backend.cleverapps.io/
 * DISCOVERY_PORT= 80
 * DISCOVERY_HOST= pico.backend.cleverapps.io
 * DISCOVERY_PROTOCOL= http
 */

let discoveryPort = process.env.DISCOVERY_PORT || 9099;
let discoveryHost = process.env.DISCOVERY_HOST || "localhost"
let discoveryProtocol = process.env.DISCOVERY_PROTOCOL || "http"

let discoveryBackend = new DiscoveryBackend({
  protocol: discoveryProtocol, 
  host: discoveryHost,
  port: discoveryPort,
  keyServices:"domain-demo"
})

let port = process.env.PORT || 9090;

let service = new Service({})

service.get({uri:`/`, f: (request, response) => {

  discoveryBackend.getServices({filter: service => service.name == "calc" },  results => {
    results.when({
      Failure: error => {
        console.log("😡 Houston? We have a problem!", error)
        response.sendJson({error: "😡 Houston? We have a problem!"})
      },
      Success: servicesRecords => {
        let selectedService = servicesRecords[0] // get the first service with a name == "calc"
        // create a client from the record
        let client = new Client({service: selectedService})
        
        // check that the service is ok and then call the service methods by name
        client.healthCheck().then(res => {
          
          client.callMethod({name:"add1", urlParams:[40,2]}) // GET picoservice
          .then(res => {
            let result1 = res
            client.callMethod({name:"add2", data:{a:21, b: 21} }) // POST picoservice
            .then(res => {
              let result2 = res
              response.sendJson({result1, result2})
            }) 
          }) 
        })
      }
    })
  })
}})

service.start({port: port}, res => {
  res.when({
    Failure: error => console.log("😡 Houston? We have a problem!"),
    Success: port => {
      console.log(`🌍 client is listening on ${port}`)
    }
  })
}) // end of start
