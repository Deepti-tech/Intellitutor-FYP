import React, { useState, useEffect, useRef, useMemo } from 'react'
import Navbar, { linkList } from '../Components/Navbar'
import { getStreamId, sendBlobData } from '../js/httpHandler'
import { useNotifier } from '../js/utils';
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const CandidateInterviewPage = ({ interview_id, designation }) => {
    const [permissionError, setPermissionError] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [streamId, setStreamId] = useState('');
    const [userRole, setUserRole] = useState('');
    const videoFrameRef = useRef();
    const notifier = useNotifier();
    const [runExecuted, setRunExecuted] = useState(false);

    const send_blobs = async (blob_data) => {
        if (streamId) {
            sendBlobData(notifier, streamId, blob_data)
        } else {
            throw new Error('Stream Id not present')
        }
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
                    //const blob_data = new Blob(e.data, { type: ' { type: 'video/ webm' }' });
                };
            mediaRecorder.start(5000);
        }
    }, [mediaRecorder, streamId])


    const allowRecording = () => {
        run();
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(async (permissionObj) => {
                document.getElementById('questions').style.display = 'flex';
                document.getElementById('buttons').style.opacity = '1';
                setPermissionGranted(true);
                videoFrameRef.current.srcObject = permissionObj;
                const _streamId = await getStreamId(notifier, interview_id);
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

    const genAI = new GoogleGenerativeAI("AIzaSyCcODVcOwLOY2q5-Tr2oqyduitCKVrel7Y");
    const [Questions, setQuestions] = useState('');
    const run = async () => {
        if (!runExecuted) {
            setUserRole({designation})
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = "Assume you are an interviewer. Ask 5 questions based on the role: " + userRole + " to a candidate. Do not give answers. Avoid using this ** ";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            setQuestions(text);
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
            <Navbar selectedPage={linkList.HOME} />
            <div className='page-container'>
            {(!permissionGranted) &&
                    <>
                        <label style={{ fontWeight: '600' }}>Click To give camera Permission</label>
                        <button className="custom-purple" onClick={allowRecording}> Start Camera</button>
                    </>
                }
            <div className='interview-list-container' id='questions' style={{display: 'none', fontSize: '1.2rem', fontWeight: '600'}}>
            <div className='interview-item'>
            <div >
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
                    
                <div id='buttons' style={{justifyContent: 'space-between', marginTop: '5px', opacity: '0' }}>
                        {/* <button className='custom-blue' id='complete' style={{ float: 'right', marginRight: '20px' }} onClick={stopRecording}> Complete Interview</button> */}
                        <button className='custom-blue' style={{ float: 'right', marginRight: '20px' }} onClick={nextQuestion} disabled={currentQuestionIndex === parsedQuestions.length - 1}>Next</button>
                        <button className='custom-blue' style={{ float: 'right', marginRight: '20px' }} onClick={prevQuestion} disabled={currentQuestionIndex === 0}>Previous</button>
                    </div>
                {permissionError &&
                    <div className='alert-message'>
                        <span> Error: User did not grant camera permission</span>
                    </div>}
                    </div>
                  </div>
                <div className={`video-container ${(permissionGranted) ? 'visible' : ''}`}>
                    <video className='video-frame' autoPlay onLoadStart={(e) => { e.currentTarget.volume = 0 }} ref={videoFrameRef}></video>
                </div>

            </div>
        </div>
    )
}

export default CandidateInterviewPage