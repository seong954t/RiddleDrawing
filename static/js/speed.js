let mousePressed = false;
let coords = [];
let classNames = [];
let mode;
let answerClassName;

window.onload = function(){
    start();
    window.drawableCanvas.initialize('drawable-canvas', 400, 400);
    window.
    document.querySelector('#clear-btn').addEventListener('click', resetCanvas);

    window.drawableCanvas.event.mouse.up(mouseUpProcess);
    window.drawableCanvas.event.mouse.down(mouseDownProcess);
    window.drawableCanvas.event.mouse.move(mouseMovePorcess);

    function Timer(timeleft, timetotal, $element){
        $element.html(timeleft%61);
        if(timeleft > 0) {
            setTimeout(function() {
                Timer(timeleft - 1, timetotal, $element);
            }, 1000);
        }
    };

    Timer(document.querySelector("#timer").innerText,document.querySelector("#timer").innerText,$('#timer'));
}

function mouseUpProcess(){
    setPredictAnswer();
    mousePressed = false;
}

function mouseDownProcess(){
    mousePressed = true;
}

function mouseMovePorcess(event){
    recordCoor(event);
}

function recordCoor(event) {
    var pointer = window.drawableCanvas.getCanvas().getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer)
    }
}

function getMinBox() {
    var coorX = coords.map(function(p) {
        return p.x
    });
    var coorY = coords.map(function(p) {
        return p.y
    });

    var min_coords = {
        x: Math.min.apply(null, coorX),
        y: Math.min.apply(null, coorY)
    }
    var max_coords = {
        x: Math.max.apply(null, coorX),
        y: Math.max.apply(null, coorY)
    }

    return {
        min: min_coords,
        max: max_coords
    }
}

function getImageData() {
    const mbb = getMinBox()

    const dpi = window.devicePixelRatio
    const imgData = window.drawableCanvas.getCanvas().contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                  (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
    return imgData
}

function setPredictAnswer() {
    if (coords.length >= 2) {
        const imgData = getImageData()

        const pred = model.predict(preprocess(imgData)).dataSync()

        const indices = findIndicesOfMax(pred, 3)
        // const probs = findTopValues(pred, 3)
        const names = getClassNames(indices)

        const answerTextList = document.querySelectorAll(".answer-text");
        const answerPointList = document.querySelectorAll(".answer-point");
        
        for(var i = 0; i<3; i++){
            answerTextList[i].innerText = (i+1)+". "+names[i];
            if(answerClassName === name[i]){
                answerPointList[i].innerText = "";
            }
        }
        // console.log('probs : ', probs);
    }
}

function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
        outp[i] = classNames[indices[i]]
    return outp
}

async function loadDict() {
    await $.ajax({
        url: '../static/model/class_names.txt',
        dataType: 'text',
    }).done(success);
}

function success(data) {
    const lst = data.split(/\n/)
    for (var i = 0; i < lst.length - 1; i++) {
        let symbol = lst[i]
        classNames[i] = symbol
    }
    resetDrawData();
}

function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); 
        if (outp.length > count) {
            outp.sort(function(a, b) {
                return inp[b] - inp[a];
            });
            outp.pop();
        }
    }
    return outp;
}

function findTopValues(inp, count) {
    var outp = [];
    let indices = findIndicesOfMax(inp, count)
    
    for (var i = 0; i < indices.length; i++)
        outp[i] = inp[indices[i]]
    return outp
}

function preprocess(imgData) {
    return tf.tidy(() => {
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)
        
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
        
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        const batched = normalized.expandDims(0)
        return batched
    })
}

async function start() {
    model = await tf.loadLayersModel('../static/model/model.json')
    model.predict(tf.zeros([1, 28, 28, 1]))
    await loadDict()
}

function resetCanvas(){
    window.drawableCanvas.clear();
    window.drawableCanvas.getCanvas().backgroundColor = '#ffffff';
    coords = [];
}

function getRandomClassName(){
    answerClassName = classNames[Math.floor(Math.random() * classNames.length)];
    return answerClassName;
}

function resetDrawData(){
    const questionSpan = document.querySelector("#question span");
    const answerTextList = document.querySelectorAll(".answer-text");
    const answerPointList = document.querySelectorAll(".answer-point");
    questionSpan.innerText = getRandomClassName();
    for(var i = 0; i<3; i++){
        answerTextList[i].innerText = "";
        answerPointList[i].innerText = "";
    }
}