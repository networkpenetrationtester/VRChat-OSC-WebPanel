const fs = require('node:fs');
const path = require('node:path');
const dgram = require('node:dgram');
const { fromBuffer, toBuffer } = require('osc-min');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const pretty = require('pretty');
const { merge } = require('lodash');
const os = require('node:os');

const PORT = 3000;
const PORT_FORWARDING = false;
const LOGGING = false;
const USERID = "usr_5dcc94c8-eac8-4c7e-ab83-a0cec4d95fd3"; //REPLACE WITH YOUR USERNAME
const username = os.userInfo().username;
const oscDir = `C:/Users/${username}/AppData/LocalLow/VRChat/VRChat/OSC/${USERID}/Avatars/`; //future enable automatic dir detection between windows/linux
const hostname = PORT_FORWARDING ? (async () => { return await fetch("https://api.ipify.org").then((response) => response.text()); })() : 'localhost';

const app = express();
const HTTPServer = createServer(app);
const IOServer = new Server(HTTPServer);
const Avatar = {
    config: {},
    map: []
}

function LoadAvatar(filepath) { //handle default case
    Avatar.config = fs.readFileSync(filepath, { encoding: 'utf-8' });
    eval(`Avatar.config = ${Avatar.config}`);
    Avatar.config.parameters.forEach((parameter) => parameter.input && (Avatar.map[parameter.input.address] = parameter.input.type));
    return Avatar.config;
}

function CreateHTML(config) {
    if (!config.parameters)
        return console.log('Couldn\'t generate HTML');
    let inputs = { list: [], map: {}, docmap: {} }, elements = [];
    config.parameters.forEach((param, i) => {
        if (!param.input) return;
        let inputObject = {
            output: param.output.address,
            type: param.input.type
        }
        switch (param.input.type) {
            case 'Bool':
                inputObject.value = false;
                elements.push(`<button id="${i}" onclick="button(this)">${param.name}</button>`);
                break;
            case 'Int':
                inputObject.value = 0;
                elements.push(`<input id="${i}" oninput="slider(this)" type="range" min="0" max="100" step="1">${param.name}</input>`)
                break;
            case 'Float':
                inputObject.value = 0;
                elements.push(`<input id="${i}" oninput="slider(this)" type="range" min="1e-3" max="99.999999" step="1e-6">${param.name}</input>`)
                break;
        }
        inputs.list.push(param.input.address);
        inputs.map[param.input.address] = inputObject;
        let submenus = param.input.address.split('/').slice(-2);
        if (submenus.length > 1) {
            let submenu = i;
            for (let j = submenus.length - 1; j > -1; j--) submenu = { [`${submenus[j]}`]: submenu };
            merge(inputs.docmap, submenu);
        }
    });

    fs.writeFileSync('./www/index.js', `var inputs = {
        list: ${JSON.stringify(Object.keys(inputs.map))},
        map: ${JSON.stringify(inputs.map)},
        docmap: ${JSON.stringify(inputs.docmap)}
    };
    var socket = io();
    socket.onAny((event, args) => {
        event == "update" && window.navigation.reload();
        if (input = inputs.map[event], elem = document.getElementById(inputs.list.indexOf(event)))
            input.type == "Bool" && (elem.style.backgroundColor = (input.value = args) ? "#00ff00" : "#ff0000"),
            input.type == "Int" && (elem.value = input.value = args),
            input.type == "Float" && (elem.value = input.value = args * 100);
    });
    function button(elem) {
        let ref = inputs.map[inputs.list[elem.id]];
        socket.emit(ref.output, ref.value = !ref.value);
        elem.style.backgroundColor = ref.value ? "#00ff00" : "#ff0000";
    }
    function slider(elem) {
        let ref = inputs.map[inputs.list[elem.id]];
        socket.emit(ref.output, ref.value = elem.value)
    }`);
    fs.writeFileSync('./www/index.html', pretty(`<html>
    <head>
        <title>VRC OSC${': ' + config.name}</title>
        <script src="./socket.io/socket.io.js"></script>
        <script src="/web/index.js" defer></script>
    </head>
    <body>
        <h1>${config.name}</h1><hr>
        ${elements.join('\n<br>\n')}
    </body>
</html>`));
}

function handleMessage(msg) {
    p = msg.address;
    if (p == '/avatar/change') {
        if (!LoadAvatar(oscDir + msg.value + '.json')) {
            console.log("Couldn't load avatar config.");
            return;
        }
        fs.writeFileSync('./www/avatar.json', JSON.stringify(Avatar.config), 'utf-8');
        CreateHTML(Avatar.config), IOServer.emit('update');
    }
    if (p || Object.keys(Avatar.map).includes(msg.address)) {
        LOGGING && console.log("VRChat -> Browser", [msg.address, msg.value]);
        IOServer.emit(msg.address, msg.value);
    }
}

var OSCServer = dgram.createSocket('udp4', (buf) => {
    let raw = fromBuffer(buf);
    handleMessage({
        address: raw.address,
        value: raw.args[0].value
    });
});

app.get('/interface', (req, res) => res.sendFile(path.join(__dirname, './www/index.html')));
app.use('/web', express.static(path.join(__dirname, './www')));

IOServer.on('connection', (socket) => {
    console.log('IOServer> Client connected at', socket.handshake.address)
    socket.onAny((address, args) => {
        let value = null, type = '';
        switch (Avatar.map[address]) {
            case 'Bool':
                value = Boolean(args), type = String(args);
                break;
            case 'Int':
                value = parseInt(args), type = 'integer';
                break;
            case 'Float':
                value = parseFloat(args) / 100, type = 'float';
                break;
        }
        LOGGING && console.log('Browser -> VRChat: ', [address, value]);
        OSCServer.send(toBuffer({
            address: address,
            args: [{ type: type, value: value, }],
            oscType: 'message'
        }), 9000);
    });
});

OSCServer.once('listening', () => CreateHTML(LoadAvatar('./www/avatar.json')));
OSCServer.bind(9001, () => console.log('OSCServer> bound on port 9000'));
HTTPServer.listen(PORT, hostname);