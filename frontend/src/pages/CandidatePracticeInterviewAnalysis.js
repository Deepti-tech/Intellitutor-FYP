import React, { useState, useEffect, useRef } from 'react'
import Navbar, { linkList } from '../Components/Navbar'
import { useLocation } from 'react-router-dom'
import { useIsMount, useNotifier } from '../js/utils';
import angry_image from '../media/angry.gif'
import happy_image from '../media/happy.gif'
import neutral_image from '../media/neutral-face.gif'
import sad from '../media/sad.gif'
import surprised from '../media/surprised.gif'
import {
    getTaskStatus,
    analizeCanadidateVideo,
    analizeCanadidateAudio,
    setPracticeInterviewScore
} from '../js/httpHandler';

const CandidatePracticeInterviewAnalysis = ({}) => {
    const { state } = useLocation();
    const notifier = useNotifier();
    const { username, job_id, role } = (state && state.username) ? state : { username: '', job_id: '', role: '' }
    const [intervalRunning, setIntervalRunning] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState({
    'label': { 'Angry': 0, 'Happy': 0, 'Neutral': 0, 'Sad': 0, 'Surprise': 0 },
    'processed': 0,
    'frames': 0,
});
const [percent, setPercent] = useState(0);
const [candidateScores, setCandidateScores] = useState({
    video_score: 0,
    audio_output: {
        'wpm': 0,
        'speed': 0,
        'initial_pause_percent': 0,
        'mute_percent': 0,
        'total_filler_words': 0,
        'filler_percent': 0,
    },
    audio_score: 0
});
const sourceRef = useRef();
const videoRef = useRef();
const [interviewAnalStarted, setInterviewAnalStarted] = useState(false);
const [audioStarted, setAudioStarted] = useState(false);
const [tipsGenStarted, settipsGenStarted] = useState(false);
const [audioCompleted, setAudioCompleted] = useState(false)
const [tipsGenCompleted, settipsGenCompleted] = useState(false)
const REFRESH_INTERVAL = 1500;
const videoPath = state.videoPath
const interview_id = state.id

useEffect(() => {
    setPercent(Math.round(analysisProgress.processed / Math.max(analysisProgress.frames, 1) * 100))
    setCandidateScores(
        {
            ...candidateScores, video_score: Math.round(
                ((1.5 * analysisProgress.label.Happy)
                    + (1.2 * analysisProgress.label.Surprise)
                    + (analysisProgress.label.Neutral)
                    - (1.25 * analysisProgress.label.Sad)
                    - (1.5 * analysisProgress.label.Angry)) * (100 / (Math.max(analysisProgress.processed, 1) * 1.5))
            )
        }

    )
}, [analysisProgress])

useEffect(() => {
    const payload = {
        'Happy': analysisProgress.label.Happy,
        'Sad': analysisProgress.label.Sad,
        'Angry': analysisProgress.label.Angry,
        'Surprise': analysisProgress.label.Surprise,
        'Neutral': analysisProgress.label.Neutral,
        'video_score': candidateScores.video_score,
        'speed': candidateScores.audio_output.speed,
        'wpm': candidateScores.audio_output.wpm,
        'initial_pause_percent': candidateScores.audio_output.initial_pause_percent,
        'mute_percent': candidateScores.audio_output.mute_percent,
        'total_filler_words': candidateScores.audio_output.total_filler_words,
        'filler_percent': candidateScores.audio_output.filler_percent,
        'audio_score': 0.2 * candidateScores.audio_output.wpm +
        0.1 * candidateScores.audio_output.initial_pause_percent +
        0.1 * candidateScores.audio_output.mute_percent +
        0.2 * candidateScores.audio_output.total_filler_words +
        0.2 * candidateScores.audio_output.filler_percent,
    }
    setPracticeInterviewScore(interview_id, payload)
})

const analizeInterview = async () => {

    if (!intervalRunning) {
        const task_id = await analizeCanadidateVideo(notifier, videoPath);
        if (!task_id) {
            console.error("Task couldn't be created.")
            return
        }
        const _intervalCounter = setInterval(async () => {
            setInterviewAnalStarted(true);
            const response = await getTaskStatus(notifier, task_id);

            if (!(response && response.status)) {
                console.error('No response status found')
            }
            else {
                if (response.status == 'Success') {
                    setAnalysisProgress(response.result)
                    setIntervalRunning(false);
                    clearInterval(_intervalCounter);
                }
                else if (response.status == 'Failed') {
                    console.error('Task failed in server');
                    setIntervalRunning(false);
                    clearInterval(_intervalCounter);
                }
                else {
                    if ('progress' in response) {
                        setAnalysisProgress(response.progress)
                    }
                }
            }
        }, REFRESH_INTERVAL);
        console.warn('Interval counter started')
        setIntervalRunning(true)
    }

}


const analizeAudio = async () => {

    if (!intervalRunning) {
        const task_id = await analizeCanadidateAudio(notifier, videoPath);
        if (!task_id) {
            console.error("Task couldn't be created.")
            return
        }

        const _intervalCounter = setInterval(async () => {
            setAudioStarted(true);
            const response = await getTaskStatus(notifier, task_id);

            if (!(response && response.status)) {
                console.error('No response status found')
            }
            else {
                if (response.status == 'Success') {
                    setCandidateScores({ ...candidateScores, audio_output: response.result })
                    setAudioCompleted(true);
                    setIntervalRunning(false);
                    clearInterval(_intervalCounter);
                }
                else if (response.status == 'Failed') {
                    console.error('Task failed in server');
                    setIntervalRunning(false);
                    clearInterval(_intervalCounter);
                }
            }
        }, REFRESH_INTERVAL);

        console.warn('Interval counter started')
        setIntervalRunning(true)
    }
}
const [tipsResult, setTipsResult] = useState('');
const GetTips = async () => {
    const url = 'https://chatgpt-42.p.rapidapi.com/conversationgpt4';
    const query1 = "I gave a practice interview. Act as if you took my interview and following are details. My speaking speed was" + candidateScores.audio_output.speed + "word per minute(wpm) was" + candidateScores.audio_output.wpm + "The initial pause was" + candidateScores.audio_output.initial_pause_percent + "and my pause percentage was" + candidateScores.audio_output.mute_percent + ". I used" + candidateScores.audio_output.total_filler_words + " filler words and my filler percentage is" + candidateScores.audio_output.filler_percent;
    const query2 = "Following are the number of frames for each emotions I displayed (do not use the word 'frames' in reply) 1.Happy: " + analysisProgress.label.Happy + "2. Sad: " + analysisProgress.label.Sad + "3. Angry:" + analysisProgress.label.Angry + "4.Surprise:" + analysisProgress.label.Surprise + "5.Neutral:" + analysisProgress.label.Neutral + " Tell me my strong points and how to improve on weak areas precisely in 5-7 lines.";
    const query = query1 + query2;
    settipsGenStarted(true);
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'X-RapidAPI-Key': 'e95bd5207emsh57746e4debc5426p175cf8jsn6fb4c4a58bf6',
            'X-RapidAPI-Host': 'chatgpt-42.p.rapidapi.com',
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: query
                }
            ],
            system_prompt: '',
            temperature: 0.5,
            top_k: 50,
            top_p: 0.9,
            max_tokens: 200
        })
    };

    try {
        const response = await fetch(url, options);
        settipsGenCompleted(true);
        const jsonResponse = await response.json();
        const { result } = jsonResponse;
        setTipsResult(result); 
    } catch (error) {
        console.error(error);
    }
}
return(
    <div className='page-wrapper'>
        <Navbar selectedPage={linkList.PRACTICE_INTERVIEW} />
        <div className='page-container'>
        <span style={{ color: 'var(--ui-color)', fontSize: '1.4rem', fontWeight: 'bold', padding: '10px' }}>
                Prepare to Shine!</span>
                <div className='video-container visible' style={{ border: '2px solid black', marginTop: '20px' }}>
                    <video width='480' height='360' controls ref={videoRef}>
                        <source src={`http://localhost:5000/getInterviewVideo?file_path=${videoPath}`} ref={sourceRef} />
                    </video>
                </div>


                <div className='ai-action-section'>
                    <div className='job-control-container' style={{ alignSelf: 'flex-start', width: '100%' }}>
                        <button className='custom-blue' style={{width:'130px'}} onClick={analizeInterview}> Analize Interview</button>
                        {
                            (interviewAnalStarted) &&
                            <div className='interview-analysis'>
                                <div style={{ alignSelf: 'flex-start' }}>
                                    Frames Processed: {analysisProgress.processed}/ {analysisProgress.frames}
                                </div>


                                <div className='emoji-container' >
                                    <img height={60} width={60} src={happy_image} />
                                    <span style={{ fontSize: '1.8rem' }}>{analysisProgress.label.Happy}</span>

                                    <img height={38} width={38} src={neutral_image} />
                                    <span style={{ fontSize: '1.8rem' }}>{analysisProgress.label.Neutral}</span>

                                    <img height={60} width={60} src={sad} />
                                    <span style={{ fontSize: '1.8rem' }}>{analysisProgress.label.Sad}</span>

                                    <img height={60} width={60} src={surprised} />
                                    <span style={{ fontSize: '1.8rem' }}>{analysisProgress.label.Surprise}</span>

                                    <img height={60} width={60} src={angry_image} />
                                    <span style={{ fontSize: '1.8rem' }}>{analysisProgress.label.Angry}</span>
                                </div>

                                {(percent !== 100) &&
                                    <div className='tsk-progress-bar-container'>
                                        <div style={{ minHeight: '100%' }}>
                                            <span className='tsk-progress-prercent cont'>{`${percent} %`}</span>
                                        </div>
                                        <div className='tsk-progress-bar' style={{ width: `${percent}%` }}>
                                            <span className='tsk-progress-prercent inside-bar'>{`${percent} %`}</span>&nbsp;
                                        </div>
                                    </div>
                                }
                                <div style={{ alignSelf: 'flex-start' }}>
                                    <span style={{ color: 'red', fontSize: '1.3rem' }}>Video Score: </span>
                                    <span style={{ fontSize: '1.3rem' }}>{candidateScores.video_score}</span>
                                </div>
                            </div>
                        }
                    </div>


                    <div className='job-control-container' style={{ alignSelf: 'flex-start', width: '100%' }}>
                        <button className='custom-blue'  onClick={analizeAudio} style={{width:'130px'}}> Analize Speech</button>

                        {
                            ((audioStarted && (!audioCompleted))) && <span style={{marginTop:'10px', color:'#411d7aaa', fontSize:'1.1rem', fontWeight:'600'}}> Analyzing Audio ...</span>
                        }

                        {
                            (audioCompleted) &&
                            <div className='interview-analysis' >
                                <div style={{ alignSelf: 'stretch' }}>
                                    <div>
                                        <span style={{ fontSize: '1.3rem', textDecoration: 'underlined' }} >Speech Analysis</span>
                                    </div>

                                    <div className='audio-result-container'>
                                        <div>
                                            <span style={{ fontSize: '1.1rem' }}> Speech Speed: <span style={{ color: 'black' }}> {candidateScores.audio_output.speed} </span></span>
                                        </div>

                                        <div>
                                            <span style={{ fontSize: '1.1rem' }}> WPM: <span style={{ color: 'black' }}> {candidateScores.audio_output.wpm} </span></span>
                                        </div>

                                        <div>
                                            <span style={{ fontSize: '1.1rem' }}> Initial Pause Percent: <span style={{ color: 'black' }}> {candidateScores.audio_output.initial_pause_percent} </span></span>
                                        </div>

                                        <div>
                                            <span style={{ fontSize: '1.1rem' }}> % Time not spoken: <span style={{ color: 'black' }}> {candidateScores.audio_output.mute_percent} </span></span>
                                        </div>

                                        <div>
                                            <span style={{ fontSize: '1.1rem' }}> Total Filler words used: <span style={{ color: 'black' }}> {candidateScores.audio_output.total_filler_words} </span></span>
                                        </div>

                                        <div>
                                            <span style={{ fontSize: '1.1rem' }}> % Filler words used: <span style={{ color: 'black' }}> {candidateScores.audio_output.filler_percent} </span></span>
                                        </div>
                                    </div>
                                    <span style={{ color: 'red', fontSize: '1.3rem' }}>Audio Score: </span>
                                    <span style={{ fontSize: '1.3rem' }}>{Math.round((0.2 * candidateScores.audio_output.wpm +
                        0.1 * candidateScores.audio_output.initial_pause_percent +
                        0.1 * candidateScores.audio_output.mute_percent +
                        0.2 * candidateScores.audio_output.total_filler_words +
                        0.2 * candidateScores.audio_output.filler_percent))}</span>
                                </div>
                            </div>
                        }
                    </div>

                    <div className='job-control-container' style={{ alignSelf: 'flex-start', width: '100%' }}>
                        <button className='custom-blue'  onClick={GetTips} style={{width:'130px'}}> Get Tips</button>

                        {
                            ((tipsGenStarted && (!tipsGenCompleted))) && <span style={{marginTop:'10px', color:'#411d7aaa', fontSize:'1.1rem', fontWeight:'600'}}> Generating tips ...</span>
                        }

                        {
                            (tipsGenCompleted) &&
                            <div className='interview-analysis' >
                                <div style={{ alignSelf: 'stretch' }}>

                                    <div className='audio-result-container'>                                       
                                        <div>
                                            <span style={{ fontSize: '1.1rem' }}> Tips: <span style={{ color: 'black' }}> {tipsResult} </span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
                </div>
)
}
export default CandidatePracticeInterviewAnalysis
