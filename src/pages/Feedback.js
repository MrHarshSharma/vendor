import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase/setup";
import { doc, getDoc } from "firebase/firestore";
import { message, Spin } from "antd";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setPageLoading } from "../actions/storeActions";
import AppLayout from "./AppLayout";
import { FaStar } from "react-icons/fa";
import { CheckCircleOutlined, SmileOutlined } from "@ant-design/icons";

const Feedback = () => {
  const { storeId, orderId, customerId } = useParams();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [alreadyFeedbackSubmitted, setAlreadyFeedbackSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sudoState, setSudoState] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageLoading({ payload: true }));
  }, [dispatch]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const configRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(configRef);

        if (docSnap.exists()) {
          setSelectedOrder(docSnap.data());
          setFeedback(
            docSnap.data().order.map((item) => ({
              itemName: item.name,
              rating: 0,
              comment: "",
            }))
          );
        } else {
          console.log("No such order!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        dispatch(setPageLoading({ payload: false }));
      }
    };

    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, storeId, dispatch]);

  const handleRatingChange = (index, rating) => {
    const updatedFeedback = [...feedback];
    updatedFeedback[index].rating = rating;
    setFeedback(updatedFeedback);
  };

  const handleCommentChange = (index, comment) => {
    const updatedFeedback = [...feedback];
    updatedFeedback[index].comment = comment;
    setFeedback(updatedFeedback);
  };

  useEffect(() => {
    const checkFeedback = async () => {
      const feedbacksRef = collection(db, "feedbacks");
      const q = query(
        feedbacksRef,
        where("storeId", "==", storeId),
        where("orderId", "==", orderId),
        where("customerId", "==", customerId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setAlreadyFeedbackSubmitted(true);
      } else {
        setAlreadyFeedbackSubmitted(false);
      }
    };

    checkFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sudoState, storeId, orderId, customerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const feedbacksRef = collection(db, "feedbacks");
      await addDoc(feedbacksRef, {
        storeId,
        orderId,
        customerId,
        feedback,
        timeStamp: new Date(),
      });
      message.success("Thank you for your valuable feedback!");
      setSudoState((prev) => prev + 1);
    } catch (error) {
      console.error("Error adding document: ", error);
      message.error("Can't process your feedback at the moment. Please try again");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      backgroundColor: "#1E2433",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "24px 16px",
      borderBottom: "1px solid #2B3041",
      textAlign: "center",
    },
    headerTitle: {
      color: "white",
      fontSize: "22px",
      fontWeight: "700",
      margin: 0,
    },
    headerSubtitle: {
      color: "#9CA3AF",
      fontSize: "14px",
      marginTop: "8px",
    },
    content: {
      flex: 1,
      padding: "16px",
      overflowY: "auto",
    },
    itemCard: {
      backgroundColor: "#2B3041",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "16px",
    },
    itemName: {
      color: "white",
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "4px",
    },
    itemDescription: {
      color: "#9CA3AF",
      fontSize: "14px",
      marginBottom: "20px",
    },
    ratingLabel: {
      color: "#9CA3AF",
      fontSize: "14px",
      marginBottom: "12px",
      display: "block",
    },
    starsContainer: {
      display: "flex",
      gap: "8px",
      marginBottom: "20px",
    },
    star: {
      fontSize: "28px",
      cursor: "pointer",
      transition: "transform 0.2s, color 0.2s",
    },
    starActive: {
      color: "#F59E0B",
    },
    starInactive: {
      color: "#3B4256",
    },
    commentLabel: {
      color: "#9CA3AF",
      fontSize: "14px",
      marginBottom: "8px",
      display: "block",
    },
    textarea: {
      width: "100%",
      backgroundColor: "#3B4256",
      border: "none",
      borderRadius: "12px",
      padding: "14px",
      color: "white",
      fontSize: "14px",
      resize: "vertical",
      minHeight: "80px",
      outline: "none",
      boxSizing: "border-box",
    },
    footer: {
      padding: "20px 16px",
      borderTop: "1px solid #2B3041",
    },
    submitBtn: {
      width: "100%",
      height: "56px",
      backgroundColor: "#22C55E",
      border: "none",
      borderRadius: "12px",
      color: "white",
      fontSize: "18px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    },
    successCard: {
      backgroundColor: "#2B3041",
      borderRadius: "16px",
      padding: "40px 20px",
      textAlign: "center",
      marginTop: "20px",
    },
    successIcon: {
      fontSize: "64px",
      color: "#22C55E",
      marginBottom: "20px",
    },
    successTitle: {
      color: "white",
      fontSize: "20px",
      fontWeight: "600",
      marginBottom: "12px",
    },
    successText: {
      color: "#9CA3AF",
      fontSize: "14px",
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px",
    },
  };

  const renderStars = (index) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        style={{
          ...styles.star,
          ...(feedback?.[index]?.rating >= star ? styles.starActive : styles.starInactive),
        }}
        onClick={() => handleRatingChange(index, star)}
      >
        <FaStar />
      </span>
    ));
  };

  return (
    <AppLayout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Share Your Feedback</h1>
          <p style={styles.headerSubtitle}>
            Help us improve by rating your experience
          </p>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {alreadyFeedbackSubmitted === null ? (
            <div style={styles.loadingContainer}>
              <Spin size="large" />
            </div>
          ) : alreadyFeedbackSubmitted === true ? (
            <div style={styles.successCard}>
              <CheckCircleOutlined style={styles.successIcon} />
              <div style={styles.successTitle}>Feedback Already Submitted</div>
              <div style={styles.successText}>
                Thank you! You've already shared your feedback for this order.
                <br />
                Place another order to share feedback again.
              </div>
            </div>
          ) : (
            selectedOrder && (
              <>
                {selectedOrder.order.map((item, index) => (
                  <div style={styles.itemCard} key={index}>
                    <div style={styles.itemName}>{item.name}</div>
                    {item.description && (
                      <div style={styles.itemDescription}>{item.description}</div>
                    )}

                    <span style={styles.ratingLabel}>How was it?</span>
                    <div style={styles.starsContainer}>{renderStars(index)}</div>

                    <span style={styles.commentLabel}>Any comments? (optional)</span>
                    <textarea
                      style={styles.textarea}
                      placeholder="Share your thoughts..."
                      value={feedback?.[index]?.comment || ""}
                      onChange={(e) => handleCommentChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </>
            )
          )}
        </div>

        {/* Footer - Submit Button */}
        {alreadyFeedbackSubmitted === false && selectedOrder && (
          <div style={styles.footer}>
            <button
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Spin size="small" />
              ) : (
                <>
                  <SmileOutlined /> Submit Feedback
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Feedback;
