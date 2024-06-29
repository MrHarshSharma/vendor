import React from 'react'
import { useEffect } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { db } from '../firebase/setup';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';


const Feedback = () => {
    const { storeId, orderId } = useParams();
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [feedback, setFeedback] = useState([]);
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
      const handleSubmit = (e) => {
        e.preventDefault();
        // Submit feedback logic here (e.g., send to backend or EmailJS)
        console.log('Feedback submitted:', feedback);
        // Reset form or show confirmation to user
      };

      
  return (
    
    <div style={{padding:'10px'}}>
      <span>Feedback Form</span>
      <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'20px', marginTop:'20px'}}>
        {selectedOrder?.order?.map((item, index) => (
          <div key={index} style={{display:'flex', flexDirection:'column', gap:'5px', boxShadow:'0px 0px 20px -15px #000', borderRadius:'5px', padding:'10px'}}>
            <span>{item.name}</span>
            <span className='smallFont menu-item-description'>{item.description}</span>
         
            <span>
              Rating
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
            Any comments:
            <textarea
            value={feedback?.[index]?.comment}
            onChange={(e) => handleCommentChange(index, e.target.value)}
          />
          </span>
            <br />
          </div>
        ))}
        <button type="submit">Submit Feedback</button>
      </form>
    </div>
  )
}

export default Feedback