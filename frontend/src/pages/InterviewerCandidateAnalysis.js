import React, { useEffect, useRef, useState } from 'react'
import Navbar, { linkList } from '../Components/Navbar';
import { useIsMount, useNotifier } from '../js/utils';
import angry_image from '../media/angry.gif'
import happy_image from '../media/happy.gif'
import neutral_image from '../media/neutral-face.gif'
import sad from '../media/sad.gif'
import surprised from '../media/surprised.gif'
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import textfile from '../audio.txt';
import { useLocation } from 'react-router-dom'
import {
    getCandidateProfile,
    analizeCanadidateResume,
    getTaskStatus,
    analizeCanadidateVideo,
    analizeCanadidateAudio,
    createTextFile
} from '../js/httpHandler';

const InterviewerCandidateAnalysis = ({ candidate_username, video_path, job_id, designation }) => {
    // video_path = 'C:/Users/Deepti Singh/Documents/FYP/Intellitutor-FYP/Archive-Version-1/src/input/d997b4ed-5462-11ee-8ddb-141333178768.mp4'
    const [videoPath, setVideoPath] = useState(video_path)
    const [intervalRunning, setIntervalRunning] = useState(false);
    const [resumeAnalysisText, setResumeAnalysisText] = useState('');
    const { state } = useLocation();
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
    const [runExecuted, setRunExecuted] = useState(false);
    const [run1Executed, setRun1Executed] = useState(false);
    const [tipsGenStarted, settipsGenStarted] = useState(false);
    const [AnsCorrectionStarted, setAnsCorrectionStarted] = useState(false);
    const [tipsGenCompleted, settipsGenCompleted] = useState(false)
    const [AnsCorrectionCompleted, setAnsCorrectionCompleted] = useState(false)
    // const interview_id = state.id
    const [answerResult, setanswerResult] = useState('');
    const role = designation
const questions = state.questions
    useEffect(() => {
        if (sourceRef.current.src && videoRef.current) {
            sourceRef.current.src = `http://localhost:5000/getInterviewVideo?file_path=${videoPath}`
            videoRef.current.load();
        }

    }, [videoPath])

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


    const [interviewAnalStarted, setInterviewAnalStarted] = useState(false);
    const [audioStarted, setAudioStarted] = useState(false);
    const [audioCompleted, setAudioCompleted] = useState(false)
    const [candidateProfile, updateCandidateProfile] = useState({
        profile_image: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png',
        first_name: '',
        last_name: '',
        job: '',
        resume_location: '',
    });
    const notifier = useNotifier();
    const isResumeUploaded = () => { return (candidateProfile.resume_location.constructor === String && candidateProfile.resume_location !== '') };
    const firstMount = useIsMount();

    useEffect(() => {
        if (firstMount)
            fetchCandidateProfile();
    }, [])

    const fetchCandidateProfile = async () => {
        const candidate_data = await getCandidateProfile(notifier, candidate_username);
        if (Object.keys(candidate_data).length > 0) {
            updateCandidateProfile(candidate_data);
        }
    }

    const REFRESH_INTERVAL = 1500;
    const analizeResume = async () => {
        // Add Interval counter if not exists
        if (!intervalRunning) {
            const task_id = await analizeCanadidateResume(notifier, candidate_username, job_id);
            if (!task_id) {
                console.error("Task couldn't be created.")
                return
            }

            // Main intervel. Runs every 2 second to check for job status.
            const _intervalCounter = setInterval(async () => {
                const response = await getTaskStatus(notifier, task_id);

                if (!(response && response.status)) {
                    console.error('No response status found')
                }
                else {
                    if (response.status == 'Success') {
                        setResumeAnalysisText(`By resume analysis, the candidate is ${response.result} % fit for your Job role.`);
                        setIntervalRunning(false);
                        clearInterval(_intervalCounter);
                    }
                    else if (response.status == 'Failed') {
                        setResumeAnalysisText('Some error occured in Server');
                        console.error('Task failed in server');
                        setIntervalRunning(false);
                        clearInterval(_intervalCounter);
                    }
                }
            }, REFRESH_INTERVAL);

            // Set Interval counter in state, so that click on button multiple times don't generate new counters,
            // if one counter is already running.
            console.warn('Interval counter started')
            setIntervalRunning(true)
        }
    }

    const analizeInterview = async () => {

        if (!intervalRunning) {
            const task_id = await analizeCanadidateVideo(notifier, videoPath);
            if (!task_id) {
                console.error("Task couldn't be created.")
                return
            }

            // Main intervel. Runs every 2 second to check for job status.
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

            // Set Interval counter in state, so that click on button multiple times don't generate new counters,
            
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

            // Main intervel. Runs every 2 second to check for job status.
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

            // Set Interval counter in state, so that click on button multiple times don't generate new counters,
            // if one counter is already running.
            console.warn('Interval counter started')
            setIntervalRunning(true)
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
    console.log("Role: "+ role)
    console.log("Q: "+ questions)
    console.log("A: "+ answers)
    const query1 = "I had an interview,the role was:"+role+"the 5 questions asked are:"+questions+"And the answers I gave are:"+answers
    const query2 = "Check the answers, each question holds 20 points. Identify if the answer is right or wrong answer (if wrong then why), areas of improvement and the score. Use the word you for explaining"
    const query3 = "Give the total scores out of 100 at the end."
    const query = query1 + query2 + query3
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
    return (
        <div className='page-wrapper'>
            <Navbar selectedPage={linkList.HOME} />
            <div className='page-container'>
                <div className='sample-interview-div'>
                    <button className='custom-blue-reverse'  onClick={() => { setVideoPath('uploads/sample.mp4')}}>Load Sample Interview</button>
                </div>
                <div className='profile-orverview'>

                    {/* <div className='profile-image-container'>

                        <img className='profile-image' src={candidateProfile.profile_image} />
                    </div> */}

                    <span style={{ fontWeight: '600', fontSize: '1.2rem' }}>{`${candidateProfile.first_name} ${candidateProfile.last_name}`}</span>
                    <span style={{ fontSize: '1.05rem' }}>{candidateProfile.job}</span>
                </div>

                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#42A0DF' }}> Candidate Interview Recording</span>
                <div className='video-container visible' style={{ border: '2px solid black', marginTop: '20px' }}>
                    <video width='480' height='360' controls ref={videoRef}>
                        <source src={`http://localhost:5000/getInterviewVideo?file_path=${videoPath}`} ref={sourceRef} />
                    </video>
                </div>


                <div className='ai-action-section'>
                    <div style={{ fontSize: '1rem', color: '#2b2b2bda' }}>
                        <i>Analize candidate for:</i> <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{designation}</span>
                    </div>

                    <div className='job-control-container' style={{ alignSelf: 'flex-start', width: '100%' }}>
                        {isResumeUploaded() && <button className='custom-blue' style={{width:'130px'}} onClick={analizeResume}> Analize resume</button>}
                        {
                            (resumeAnalysisText) &&
                            <div className='resume-analysis-score'>
                                {resumeAnalysisText}
                            </div>
                        }
                    </div>

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
        </div >
    )
}

export default InterviewerCandidateAnalysis