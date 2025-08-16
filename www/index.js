var inputs = {
        list: ["/avatar/parameters/Slider","/avatar/parameters/Button"],
        map: {"/avatar/parameters/Slider":{"output":"/avatar/parameters/Slider","type":"Float","value":0},"/avatar/parameters/Button":{"output":"/avatar/parameters/Button","type":"Bool","value":false}},
        docmap: {"parameters":{"Slider":0,"Button":1}}
    };
    var socket = io();
    socket.onAny((event, args) => {
        event == "update" && window.navigation.reload();
        let input = inputs.map[event], elem = document.getElementById(inputs.list.indexOf(event));
        if (input && elem)
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
    }