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

    setPracticeInterviewScore,
    createTextFile
} from '../js/httpHandler';
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import textfile from '../audio.txt';
const CandidatePracticeInterviewAnalysis = ({}) => {
    const { state } = useLocation();
    const notifier = useNotifier();
    // const { username, job_id, role } = (state && state.username) ? state : { username: '', job_id: '', role: '' }
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
    audio_score: 0,
    answer_score: 0
});
const sourceRef = useRef();
const videoRef = useRef();
const [interviewAnalStarted, setInterviewAnalStarted] = useState(false);
const [audioStarted, setAudioStarted] = useState(false);
const [tipsGenStarted, settipsGenStarted] = useState(false);
const [AnsCorrectionStarted, setAnsCorrectionStarted] = useState(false);
const [audioCompleted, setAudioCompleted] = useState(false)
const [tipsGenCompleted, settipsGenCompleted] = useState(false)
const [AnsCorrectionCompleted, setAnsCorrectionCompleted] = useState(false)
const REFRESH_INTERVAL = 1500;
const videoPath = state.videoPath
const interview_id = state.id
const role = state.role
const questions = state.questions

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
        'answer_score': candidateScores.answer_score,
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
const [answerResult, setanswerResult] = useState('');
const [runExecuted, setRunExecuted] = useState(false);
const [run1Executed, setRun1Executed] = useState(false);

const GetTips = async () => {
    const query1 = "I gave a practice interview. Act as if you took my interview and following are details. My speaking speed was" + candidateScores.audio_output.speed + "word per minute(wpm) was" + candidateScores.audio_output.wpm + "The initial pause was" + candidateScores.audio_output.initial_pause_percent + "and my pause percentage was" + candidateScores.audio_output.mute_percent + ". I used" + candidateScores.audio_output.total_filler_words + " filler words and my filler percentage is" + candidateScores.audio_output.filler_percent;
    const query2 = "Following are the number of frames for each emotions I displayed (do not use the word 'frames' in reply) 1.Happy: " + analysisProgress.label.Happy + "2. Sad: " + analysisProgress.label.Sad + "3. Angry:" + analysisProgress.label.Angry + "4.Surprise:" + analysisProgress.label.Surprise + "5.Neutral:" + analysisProgress.label.Neutral + " Tell me my strong points and how to improve on weak areas precisely in 5-7 lines.";
    const query = query1 + query2;
    settipsGenStarted(true);
    const genAI = new GoogleGenerativeAI("AIzaSyCcODVcOwLOY2q5-Tr2oqyduitCKVrel7Y");
        if (!runExecuted) {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = query;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            settipsGenCompleted(true);
            setTipsResult(text); 
            setRunExecuted(true);
        }
}
const [answers, setText] = React.useState();
useEffect(() => {    
  fetch(textfile)
    .then((response) => response.text())
    .then((textContent) => {
      setText(textContent);
    });
  }, []);
const answerAnalysis = async() =>{
    if (!intervalRunning) {
        const task_id = await createTextFile(notifier, videoPath);
        if (!task_id) {
            console.error("Task couldn't be created.")
            return
        }

        const _intervalCounter = setInterval(async () => {
            setAnsCorrectionStarted(true);
            const response = await getTaskStatus(notifier, task_id);

            if (!(response && response.status)) {
                console.error('No response status found')
            }
            else {
                if (response.status == 'Success') {
                    
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
    const query1 = "I had an interview,the role was:"+role+"the 5 questions asked are:"+questions+"And the answers I gave are:"+answers
    const query2 = "Check the answers, each question holds 20 points. Identify if the answer is right or wrong answer (if wrong then why), areas of improvement and the score. Use the word you for explaining"
    const query3 = "Give the total scores out of 100 at the end."
    const query = query1 + query2
    const genAI = new GoogleGenerativeAI("AIzaSyCcODVcOwLOY2q5-Tr2oqyduitCKVrel7Y");
         if (!run1Executed) {
             const model = genAI.getGenerativeModel({ model: "gemini-pro" });
             const prompt = query;
 
             const result = await model.generateContent(prompt);
             const response = await result.response;
             const text = response.text();
             setAnsCorrectionCompleted(true);
             setanswerResult(text); 
             setRun1Executed(true);
             setIntervalRunning(true);}
   
}
const [setScore, setScoreDone] = useState(false)
useEffect(() =>{
    if(run1Executed & !setScore){
        const scoreMatch = answerResult.match(/(\d+)\/100/);
        if (scoreMatch) {
        const score = scoreMatch[1]; 
        setCandidateScores({...candidateScores, answer_score: (score)})
        setScoreDone(true)
        } else{
            const scoreMatch = answerResult.match(/(\d+)out of 100/);
            if (scoreMatch) {
                const score = scoreMatch[1]; 
                setCandidateScores({...candidateScores, answer_score: (score)})
                setScoreDone(true)
                } else{
                console.log("Score not found in the sentence.")}
        }
    }
})
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
                                <span style={{ fontSize: '1.3rem', textDecoration: 'underlined' }} > Tips: </span>
                                    <div className='audio-result-container'>                                       
                                        <div>
                                        
                                         <span style={{ color: 'black' }}> 
                                            {tipsResult.split('\n').map((line, index) => (
                                            <div key={index} style={{ fontSize: '1.1rem' }}>
                                            {line.replace(/\*\*/g, '')}
                                        </div>
                                        ))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    <div className='job-control-container' style={{ alignSelf: 'flex-start', width: '100%' }}>
                        <button className='custom-blue'  onClick={answerAnalysis} style={{width:'130px'}}>Analize Answers</button>

                        {
                            ((AnsCorrectionStarted && (!AnsCorrectionCompleted))) && <span style={{marginTop:'10px', color:'#411d7aaa', fontSize:'1.1rem', fontWeight:'600'}}> Evaluating your answers ...</span>
                        }

                        {
                            (AnsCorrectionCompleted) &&
                            <div className='interview-analysis' >
                                <div style={{ alignSelf: 'stretch' }}>
                                <span style={{ fontSize: '1.3rem', textDecoration: 'underlined' }} > Answer Analysis </span>
                                    <div className='audio-result-container'>                                       
                                    <div>
                                        <span style={{ color: 'black' }}> 
                                           {answerResult.split('\n').map((line, index) => (
                                           <div key={index} style={{ fontSize: '1.1rem' }}> 
                                            <React.Fragment key={index}>
                                            {line.replace(/[*]/g, '')}
                                            <br />
                                            </React.Fragment>
                                            </div>
                                            ))}
                                           </span>
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