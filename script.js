const video = document.getElementById("video");
const blinkMsg = document.getElementById("blink");

const BLINK_THRESHOLD = 0.21;
let blinkCooldown = false;

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getEAR(upper, lower, left, right) {
  const vertical = dist(upper, lower);
  const horizontal = dist(left, right);
  return vertical / horizontal;
}

function showBlink() {
  blinkMsg.classList.add("show");
  setTimeout(() => blinkMsg.classList.remove("show"), 3000);
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
}

async function main() {
  await setupCamera();

  const faceMesh = new FaceMesh.FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults((results) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0)
      return;

    const lm = results.multiFaceLandmarks[0];

    const EAR_left = getEAR(
      lm[159],
      lm[145],
      lm[33],
      lm[133]
    );

    const EAR_right = getEAR(
      lm[386],
      lm[374],
      lm[362],
      lm[263]
    );

    const EAR = (EAR_left + EAR_right) / 2;

    if (EAR < BLINK_THRESHOLD && !blinkCooldown) {
      blinkCooldown = true;
      showBlink();

      setTimeout(() => (blinkCooldown = false), 400);
    }
  });

  const camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: 640,
    height: 480,
  });

  camera.start();
}

main();

