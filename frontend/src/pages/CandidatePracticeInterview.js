import React, { useState, useEffect, useRef, useMemo } from 'react'
import Navbar, { linkList } from '../Components/Navbar'
import { useNavigate } from 'react-router-dom';
import { useNotifier } from '../js/utils';
import {
    getPracticeStreamId, sendBlobData,
    scheduleCandidatePracticeInterview
} from '../js/httpHandler';
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
var videoPath, id

const CandidatePracticeInterview = ({ }) => {
    const [permissionError, setPermissionError] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [streamId, setStreamId] = useState('');
    const [userRole, setUserRole] = useState('');
    const videoFrameRef = useRef();
    const notifier = useNotifier();
    const navigate = useNavigate();
    const [runExecuted, setRunExecuted] = useState(false);

    const [isRecording, setIsRecording] = useState(false);

    const send_blobs = async (blob_data) => {
        if (streamId) {
            sendBlobData(notifier, streamId, blob_data)
        } else {
            throw new Error('Stream Id not present')
        }
    }
    const handleRoleInputChange = (event) => {
        setUserRole(event.target.value); 
    };
    const schedulePracticeInterview = async () => {
        const payload = {
          'time': parseInt(Date.parse(new Date) / 1000) + 18000,
        //   'designation': role
        }
        const response = await scheduleCandidatePracticeInterview(notifier, payload)
        if (response){
            notifier('Interview starts now...');
        }
        id = response
        allowRecording()
        videoPath = 'uploads/' + id + '.webm';
        run();
      }

    useEffect(() => {
        if (mediaRecorder && streamId) {
            mediaRecorder.ondataavailable =
                async (e) => {
                    const reader = new FileReader();
                    reader.onloadend = (_) => {
                        const result = reader.result;
                        const blob_data = new Blob([result], { type: 'application/octet-stream' });
                        send_blobs(blob_data);
                    }
                    reader.readAsArrayBuffer(e.data);
                };
            mediaRecorder.start(5000);
        }
    }, [mediaRecorder, streamId])

    const allowRecording = () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(async (permissionObj) => {
                document.getElementById('role_info').style.display = 'none';
                document.getElementById('questions').style.display = 'flex';
                document.getElementById('buttons').style.opacity = '1';
                setPermissionGranted(true);
                setIsRecording(true);
                videoFrameRef.current.srcObject = permissionObj;
                
                const _streamId = await getPracticeStreamId(notifier,id);
                if (_streamId) {
                    setStreamId(_streamId);
                }
                setMediaRecorder(new MediaRecorder(videoFrameRef.current.srcObject, { mimeType: 'video/webm' }));
            })
            .catch((error) => {
                console.error(error)
                setPermissionError(true);
            })
    };
    
    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false); 
        }
        return navigate('/practiceInterviewAnalysis', {state: {videoPath: videoPath, id: id, role: userRole, questions: Questions}});
    };
    const genAI = new GoogleGenerativeAI("AIzaSyCcODVcOwLOY2q5-Tr2oqyduitCKVrel7Y");
    const [Questions, setQuestions] = useState('');
    const run = async () => {
        if (!runExecuted) {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = "Assume you are an interviewer. Ask 5 questions based on the role: " + userRole + " to a candidate. Do not give answers. Avoid using this ** ";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            setQuestions(text);
            console.log(text)
            setRunExecuted(true);
        }
    };
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const parsedQuestions = useMemo(() => Questions.split('\n').filter(line => line.trim() !== ''), [Questions]);

    const nextQuestion = () => {
        setCurrentQuestionIndex((prevIndex) => Math.min(prevIndex + 1, parsedQuestions.length - 1));
      };
    
      const prevQuestion = () => {
        setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      };
    return (
        <div className='page-wrapper'>
            <Navbar selectedPage={linkList.PRACTICE_INTERVIEW} />
            <div className='page-container'>
            <span style={{ color: 'var(--ui-color)', fontSize: '1.4rem', fontWeight: 'bold', padding: '10px' }}>
                    Prepare to Shine!</span>
                    <><span style={{fontSize: '1.2rem', fontWeight: '600'}}>Role: {userRole}</span></>
                <div className='interview-list-container'>
                    <div className='interview-item'>
                    <div id='role_info'>
                        <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Enter the role you are preparing for...</span>
                        <input type="text" style={{ height: '35px', width: '95%' }}  value={userRole} onChange={handleRoleInputChange}/>
                    </div>
                    <div id='questions' style={{display: 'none', fontSize: '1.2rem', fontWeight: '600'}}>
                    <div>
                        {parsedQuestions.map((line, index) => (
                    <div key={index} style={{ display: index === currentQuestionIndex ? 'block' : 'none', fontSize: '1 rem', fontWeight: '500' }}>
                        <React.Fragment key={index}>
                        {line.replace(/\*/g, '')}
                        <br />
                        </React.Fragment>
                    </div>
                    ))}
                    </div>
                    

      </div>
      
                    
                    {(!permissionGranted) &&
                        <>
                            <button className="custom-purple" style={{ float: 'right', marginRight: '20px', marginTop: '5px' }} onClick={schedulePracticeInterview}> Start</button>
                        </>
                    }
                    <div id='buttons' style={{justifyContent: 'space-between', marginTop: '5px', opacity: '0' }}>
                        <button className='custom-blue' id='complete' style={{ float: 'right', marginRight: '20px' }} onClick={stopRecording}> Complete Interview</button>
                        <button className='custom-blue' style={{ float: 'right', marginRight: '20px' }} onClick={nextQuestion} disabled={currentQuestionIndex === parsedQuestions.length - 1}>Next</button>
                        <button className='custom-blue' style={{ float: 'right', marginRight: '20px' }} onClick={prevQuestion} disabled={currentQuestionIndex === 0}>Previous</button>
                    </div>
                    {permissionError &&
                        <div className='alert-message'>
                            <span> Error: User did not grant camera permission</span>
                        </div>}
                    </div>
                </div>
                <div id="recording_frame" className={`video-container ${(permissionGranted) ? 'visible' : ''}`}>
                    <video className='video-frame' autoPlay onLoadStart={(e) => { e.currentTarget.volume = 0 }} ref={videoFrameRef}></video>
                </div>
                
            </div>
        </div>  
    )
}

export default CandidatePracticeInterview