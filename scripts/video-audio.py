"""Prepare narration timeline or merge a recorded demo. Requires imageio-ffmpeg."""
import wave, json, pathlib, sys, subprocess
ROOT=pathlib.Path(__file__).resolve().parent.parent
audio=ROOT/'artifacts'/'audio'
if '--merge' not in sys.argv:
    durations=[]
    with wave.open(str(audio/'narration.wav'),'wb') as out:
        for i in range(8):
            with wave.open(str(audio/f'scene-{i}.wav'),'rb') as src:
                if i==0: out.setparams(src.getparams())
                data=src.readframes(src.getnframes());durations.append(src.getnframes()/src.getframerate())
                out.writeframes(data)
                out.writeframes(b'\0'*int(src.getframerate()*.8)*src.getsampwidth()*src.getnchannels())
    (audio/'durations.json').write_text(json.dumps(durations),encoding='utf8')
    print('Narrated video target duration:',round(sum(durations)+6.4,1),'seconds')
else:
    import imageio_ffmpeg
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-i',str(ROOT/'artifacts/video/证研-实际操作.webm'),'-i',str(audio/'narration.wav'),'-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-af','apad','-shortest','-movflags','+faststart',str(ROOT/'artifacts/证研-产品演示.mp4')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    print('Saved artifacts/证研-产品演示.mp4')
