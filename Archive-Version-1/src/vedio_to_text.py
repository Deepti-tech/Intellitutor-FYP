import os
import speech_recognition as sr

def vedio_to_text():
    command2mp3 = "ffmpeg -i input\\d997b4ed-5462-11ee-8ddb-141333178768.mp4 gen\\audio.mp3"
    command2wav = "ffmpeg -i gen\\audio.mp3 audio.wav"

    os.system(command2mp3)
    os.system(command2wav)
    r = sr.Recognizer()
    # audio = sr.AudioFile('audio.wav')
    with sr.AudioFile('audio.wav') as source:
        try:
            audio = r.record(source)  # Record the entire audio file
            text = r.recognize_google(audio)
            print("Recognized text:", text)
            file = open(r"output\\text.txt","w+")
            file.writelines(text)
            file.close()
        except sr.UnknownValueError:
            print("Google Web Speech API could not understand the audio")
        except sr.RequestError as e:
            print(f"Could not request results from Google Web Speech API; {e}")
        