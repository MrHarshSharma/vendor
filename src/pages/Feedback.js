import React from 'react'
import { useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { db } from '../firebase/setup';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import {message} from 'antd'
import { collection, addDoc , query, where, getDocs} from 'firebase/firestore';
import {useDispatch} from 'react-redux';
import { setPageLoading } from '../actions/storeActions';
import AppLayout from './AppLayout';

const Feedback = () => {
    const { storeId, orderId, customerId } = useParams();
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [feedback, setFeedback] = useState([]);
    const [alreadyFeedbackSubmitted ,setAlreadyFeedbackSubmitted] = useState(null);
    const [sudoState, setSudoState] = useState(0)
const dispatch = useDispatch();
useEffect(()=>{
  dispatch(setPageLoading({payload:true}))

},[])
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const configRef = doc(db, "orders", orderId);
                const docSnap = await getDoc(configRef);
          
                if (docSnap.exists()) {
                  setSelectedOrder(docSnap.data());
                
                  setFeedback(docSnap.data().order.map(item => ({
                    itemName: item.name,
                    rating: 0,
                    comment: ''
                  })))
                } else {
                  console.log("No such order!");
                }
              } catch (error) {
                console.error("Error fetching document:", error);
              }finally {
                dispatch(setPageLoading({payload:false}))
              }
            };
        
            fetchOrder();
      }, [orderId, storeId]);


      
    
      // Handle rating change
      const handleRatingChange = (index, rating) => {
        const updatedFeedback = [...feedback];
        updatedFeedback[index].rating = rating;
        setFeedback(updatedFeedback);
      };
    
      // Handle comment change
      const handleCommentChange = (index, comment) => {
        const updatedFeedback = [...feedback];
        updatedFeedback[index].comment = comment;
        setFeedback(updatedFeedback);
      };
    
      // Handle form submission
      useEffect(() => {

        const checkFeedback = async() =>{

            const feedbacksRef = collection(db, 'feedbacks');
            const q = query(feedbacksRef, where('storeId', '==', storeId), where('orderId', '==', orderId), where('customerId', '==', customerId));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                //   alert('Feedback already exists for this order.');
                setAlreadyFeedbackSubmitted(true)
            }
        }

        checkFeedback()
      },[sudoState])

      const handleSubmit = async (e) => {
        e.preventDefault();

      
          // Add new feedback document
          try {
            const feedbacksRef = collection(db, 'feedbacks');
            await addDoc(feedbacksRef, {
              storeId,
              orderId,
              customerId,
              feedback,
              timeStamp: new Date()
            });
            message.success('Thank you for you valuable feedback, please visit soon')
            setSudoState(prev=>prev+1)
          } catch (error) {
            console.error('Error adding document: ', error);
            message.faiiled("Can't process your feedback at the moment. Please try again")
          }
        // Reset form or show confirmation to user
      };

      
  return (
    <AppLayout>

  
    <div style={{padding:'10px'}}>
      <span>Feedback Form</span>
      {alreadyFeedbackSubmitted && (<div style={{display:'flex', flexDirection:'column', gap:'5px', boxShadow:'0px 0px 20px -15px #000', borderRadius:'5px', padding:'10px', marginTop:'20px'}}>
        <span>You have submit the feedback. Order to get a chance to share feedback again.</span>
        </div>)}
      {!alreadyFeedbackSubmitted && (
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'20px', marginTop:'20px'}}>
        {selectedOrder?.order?.map((item, index) => (
          <div key={index} style={{display:'flex', flexDirection:'column', gap:'5px', boxShadow:'0px 0px 20px -15px #000', borderRadius:'5px', padding:'10px'}}>
            <span>{item.name}</span>
            <span className='smallFont menu-item-description'>{item.description}</span>
         
            <span style={{marginTop:'20px'}}>
              Rating{" "}
              <select
                value={feedback?.[index]?.rating}
                // onChange={(e) => handleRatingChange(item.name, e.target.value)}
                onChange={(e) => handleRatingChange(index, parseInt(e.target.value))}
              >
                <option value="">Select Rating</option>
                <option value="1">⭐</option>
                <option value="2">⭐⭐</option>
                <option value="3">⭐⭐⭐</option>
                <option value="4">⭐⭐⭐⭐</option>
                <option value="5">⭐⭐⭐⭐⭐</option>
              </select>
            </span>
            <span>
            Any comments {" "} <br />
            <textarea
            value={feedback?.[index]?.comment}
            onChange={(e) => handleCommentChange(index, e.target.value)}
            style={{width:'100%'}}
          />
          </span>
            <br />
          </div>
        ))}
        <button type="submit">Submit Feedback</button>
      </form>
      )}
     
    </div>
    </AppLayout>
  )
}

export default Feedback