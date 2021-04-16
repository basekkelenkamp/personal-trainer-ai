//knn
const k = 3
const knn = new kNear(k)
const model = new Model()

//Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const landmarksContainer = document.getElementById('landmarks-container');

//Save landmarks button
const saveLandmarksButton = document.getElementById('save-landmarks');
let buttonClicked = false

saveLandmarksButton.addEventListener("click", function () {
    buttonClicked = true
});

//Train model button
const trainModelButton = document.getElementById('train-model');

trainModelButton.addEventListener("click", trainModel);


//Store current landmarks globally
let currentLandmarks
let startGame = false

//Draw landmarks on canvas
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: 2 });

    currentLandmarks = results.poseLandmarks

    if (buttonClicked) {
        displayLandmarks(results.poseLandmarks)
    }

    canvasCtx.restore();
}

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});
pose.setOptions({
    upperBodyOnly: false,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
pose.onResults(onResults);

//Draw camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera.start();


//display landmarks
function displayLandmarks(landmarks) {
    console.log(landmarks)

    let landmarkString = ''

    for (point of landmarks) {
        landmarkString = landmarkString.concat(point.x + ", " + point.y + ", " + point.z + ", " + point.visibility + ", ")
    }

    let landmarkElement = document.createElement('p')
    landmarkElement.innerText = landmarkString
    landmarksContainer.appendChild(landmarkElement)

    console.log(landmarkString)
    buttonClicked = false
}


function trainModel() {

    //Loads model into 
    model.loadModel()

    startGame = true

    predictSquat()
}


async function predictSquat(){

    if(startGame == true){
        console.log(currentLandmarks)
    
        if(currentLandmarks != undefined){
            let result = []
            for(landmark of currentLandmarks){
                result.push(landmark.x)
                result.push(landmark.y)
                result.push(landmark.z)
                result.push(landmark.visibility)
            }

            console.log(result)
            console.log(knn.classify(result))
        }
    }

    requestAnimationFrame(predictSquat)
}

