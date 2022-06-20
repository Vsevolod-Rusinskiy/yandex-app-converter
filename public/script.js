const takeScreenshot = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            mediaSource: "screen"
        }
    });

    console.log(stream)
    const track = stream.getVideoTracks()[0];
    const image = new ImageCapture(track); 
    const bitmap = await image.grabFrame(); 
    track.stop();

    const canvas = document.getElementById("screenshot");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, 1500, bitmap.height / 1.3);

    const img = canvas.toDataURL().replace(/data:image\/png;base64,/, '');
    // console.log(img);
    const searchParams = new URLSearchParams();
    searchParams.set('data', img);
    console.log(searchParams)

    try {
        const answer = await fetch('/query', {
            method: 'POST',
            body: searchParams
        });

        const response = await answer.text();
        const container = document.querySelector('.container');
        const p = document.createElement('p');
        p.innerHTML = response;
        container.prepend(p);

    } catch (err) {
        console.log(err.message);
    }
};

const button = document.getElementById("btn").onclick = () => takeScreenshot();

