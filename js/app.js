//knn
const k = 3
const knn = new kNear(k)
const model = new Model()
let currentLandmarks
let previousPrediction = ""
let audioTimer = new Audio('./files/3_second_beep.mp3')
let audioYay = new Audio('./files/yay_sound.mp3')
audioYay.volume = 0.2
let counterStarted = false
let timeNow
let startTime
let goalShown = false

//Elements
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const startAppButton = document.getElementById('start');
const counterElement = document.getElementById('counter');
const chooseDifficultyElement = document.getElementById('choose-difficulty');
const webcamTextElement = document.getElementById('webcam-text');
const buttonsElement = document.getElementById('buttons');
const gameElement = document.getElementById('game');
const trainerText = document.createElement('p');
const squatCounter = document.createElement('p');
const timerElement = document.createElement('li');
const goalElement = document.getElementById('goal');
let showGoalElement = document.createElement('li')
const congratsText = document.createElement('h2')
congratsText.id = "congrats"
startAppButton.addEventListener("click", load);


//Gamestate variables
let gameState = {
    startGame: false,
    cameraLoaded: false,
    type: "default",
    difficulty: "notSet",
    setAmount: 0,
    squats: 0,
    pushups: 0,
    elapsedTime: 0
}


//loading
if (!gameState.cameraLoaded) {
    let loadingElement = document.createElement('div')
    loadingElement.id = "loading"
    loadingElement.innerHTML = "loading.."
    document.body.appendChild(loadingElement)
}

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

    //Display buttons when camera loaded for the first time
    if (!gameState.cameraLoaded) {
        gameState.cameraLoaded = true
        buttonsElement.style.visibility = "visible"
        document.getElementById('loading').remove()
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


function load() {

    //Loads model 
    if (gameState.setAmount > 0) {
        model.loadModel()
        gameState.startGame = true
        buttonsElement.style.display = "none"
        initGame()
    }
}

function difficulty(id) {

    //buttons
    let beginnerButton = document.getElementById('beginner')
    let intermediateButton = document.getElementById('intermediate')
    let advancedButton = document.getElementById('advanced')

    gameState.difficulty = id
    gameState.type = id

    //Check difficulty
    switch (gameState.difficulty) {
        case "beginner":
            gameState.setAmount = 4
            beginnerButton.style.opacity = "1"
            intermediateButton.style.opacity = "0.25"
            advancedButton.style.opacity = "0.25"
            startAppButton.style.opacity = "1"
            break;

        case "intermediate":
            gameState.setAmount = 30
            beginnerButton.style.opacity = "0.25"
            intermediateButton.style.opacity = "1"
            advancedButton.style.opacity = "0.25"
            startAppButton.style.opacity = "1"
            break;

        case "advanced":
            gameState.setAmount = 45
            beginnerButton.style.opacity = "0.25"
            intermediateButton.style.opacity = "0.25"
            advancedButton.style.opacity = "1"
            startAppButton.style.opacity = "1"
            break;
    }

    console.log(gameState)

}


async function initGame() {

    if (gameState.startGame == true) {

        //Start predicting up or down
        let prediction = predictSquat()
        webcamTextElement.style.visibility = "visible"

        //Initialize
        trainerText.id = "trainer-text"
        squatCounter.id = "trainer-text"
        gameElement.appendChild(trainerText)
        gameElement.appendChild(squatCounter)
        gameElement.style.display = "inline-block"
        congratsText.style.display = "none"




        //3 second timeout om in juiste positie te staan
        if (gameState.squats == 0) {
            trainerText.innerHTML = "Get ready to move into a squat position..."
            audioTimer.play()
            squatCounter.innerHTML = "Squats: 0"


            if (!goalShown) {
                showGoal()
                goalShown = true
            }

            setTimeout(function () {
                trainerText.innerHTML = "Lets GO!!!!!!!"
                gameState.squats = 0.5
            }, 3000);
        }


        //Telt elke squat down en up
        if (gameState.squats > 0 && prediction != previousPrediction) {
            gameState.squats += 0.5
            previousPrediction = prediction
            updateMessage()

            //Update counter na elke squat
            if (gameState.squats % 1 == 0) {
                squatCounter.innerHTML = "Squats: " + gameState.squats
            }
        }

        if (gameState.squats > 0) {
            showTime()
        }

        if (gameState.squats == gameState.setAmount) {
            resetGame()
        }

    }



    requestAnimationFrame(initGame)
}

//Predict squat (up or down)
function predictSquat() {
    if (currentLandmarks != undefined) {
        let result = []
        for (landmark of currentLandmarks) {
            result.push(landmark.x)
            result.push(landmark.y)
            result.push(landmark.z)
            result.push(landmark.visibility)
        }

        return knn.classify(result)
    }

}


function showTime() {
    counterElement.style.visibility = "visible"
    timeNow = Date.now()

    if (!counterStarted) {
        counterStarted = true
        startTime = Date.now()
    }

    gameState.elapsedTime = Math.round((timeNow - startTime) / 1000)
    timerElement.innerHTML = gameState.elapsedTime
    counterElement.appendChild(timerElement)

}

function showGoal() {
    goalElement.style.visibility = "visible"
    showGoalElement.id = "show-goal"
    showGoalElement.innerHTML = "Goal: " + gameState.setAmount + " squats"

    goalElement.appendChild(showGoalElement)
}

function resetGame() {
    gameState.startGame = false
    audioYay.play()
    counterStarted = false
    gameState.elapsedTime = 0
    gameState.squats = 0
    goalShown = false

    congratsText.style.display = "inline-block"
    congratsText.id = "congrats"
    congratsText.innerHTML = gameState.setAmount + " squats! 🎉🎉🎉"
    document.body.appendChild(congratsText)

    chooseDifficultyElement.innerHTML = "Do another workout!"
    buttonsElement.style.display = "inline-block"
    gameElement.style.display = "none"


}

function updateMessage() {

    if (gameState.setAmount * 0.25 < gameState.squats) {
        trainerText.innerHTML = "Keep it up! 🏋️"
    }

    if (gameState.setAmount * 0.5 < gameState.squats) {
        trainerText.innerHTML = "Halfway there! 💪"
    }

    if (gameState.setAmount * 0.75 < gameState.squats) {
        trainerText.innerHTML = "Push it!!! 💨💨💨"
    }

    if (gameState.setAmount * 0.85 < gameState.squats) {
        trainerText.innerHTML = "Just a couple more! You can do it! 👏"
    }

}