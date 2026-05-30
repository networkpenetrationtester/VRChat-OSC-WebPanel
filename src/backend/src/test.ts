import dgram from 'dgram';
import * as OSC from 'node-osc';

let osc_server = new OSC.Server(9998, '192.168.1.101');
osc_server.on('message', (...args) => console.log(args));



let y = dgram.createSocket('udp4', (msg) => {
    console.log('y', msg);
});

y.bind(9999, '0.0.0.0');

let msg = new OSC.Message('/avatar/benis', 3);

y.send(OSC.encode(msg), 9998, '192.168.1.101');