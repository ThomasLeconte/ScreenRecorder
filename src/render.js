//title
var title = document.getElementById('title');
document.getElementById('titleShown').innerHTML = title.textContent;


//buttons

const closeBtn = document.getElementById('close-item')
closeBtn.onclick = e => {
    window.close();
};

const minimizeBtn = document.getElementById('minimize-item')
minimizeBtn.onclick = e => {
    remote.getCurrentWindow().minimize();
};

const videoElement = document.querySelector('video')
const startBtn = document.getElementById('startBtn')
startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
  };

const stopBtn = document.getElementById('stopBtn')
stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
  };

const videoSelectBtn = document.getElementById('videoSelectBtn')
videoSelectBtn.onClick = getVideoSources;

let mediaRecorder;
const recordedChuncks = [];

const {desktopCapturer, remote } = require('electron');
const {Menu, dialog, Notification} = remote;
const {writeFile} = require('fs');
const { electron } = require('process');

//get available screens
async function getVideoSources(){
    const inputSources = await desktopCapturer.getSources({
        types:['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source=> {
            return{
                label:source.name,
                click:()=>selectSource(source)
            };
        })
    );
    console.log(inputSources);
    videoOptionsMenu.popup();
}

//change videosource window to record
async function selectSource(source){
    videoSelectBtn.innerText = source.name;
    const constraints = {
        audio: false,
        video:{
            mandatory:{
                chromeMediaSource:'desktop',
                chromeMediaSourceId:source.id
            }
        }
    };

    const stream = await navigator.mediaDevices
        .getUserMedia(constraints);

    //preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play(); 

    const options = {mimeType: 'video/webm; codecs=vp9'};
    mediaRecorder = new MediaRecorder(stream, options);
  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Updates the UI
}

// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChuncks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
    const blob = new Blob(recordedChuncks, {
    type: 'video/webm; codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
    });

    if (filePath) {
        writeFile(filePath, buffer, () => console.log('video saved successfully!'));
        const notif = {
            title: 'ScreenRecorder',
            body: 'Vidéo enregistrée avec succès dans '+filePath+' !'
        }
        if(Notification.isSupported()){
            let myNotification = new window.Notification(notif.title, notif);
            myNotification.show();
        }
    }
}


//onload, entire screen is selected by default
window.onload = async function(){
    const inputSources = await desktopCapturer.getSources({
        types:['window', 'screen']
    });
    selectSource(inputSources[0]);
}
