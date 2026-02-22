import { Button, message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import GoogleButton from "react-google-button";
import { signInWithPopup } from "firebase/auth";
import { provider, db, auth } from "../firebase/setup";
import { doc, setDoc } from "firebase/firestore";
import {
  clearCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
} from "../actions/cartActions";
import {
  LeftOutlined,
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { setPageLoading } from "../actions/storeActions";
import AppLayout from "./AppLayout";

const ReviewMenu = () => {
  const cart = useSelector((state) => state.cartReducer.cart);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  let user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (cart.length === 0) {
      dispatch(setPageLoading({ payload: true }));
      navigate(-1);
    }
  }, [cart, dispatch, navigate]);

  const { storeId, table } = useParams();

  const cartTotal = cart.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
  const cartTotalCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const placeOrder = async () => {
    let user = JSON.parse(localStorage.getItem("user"));
    setLoading(true);
    try {
      const docRef = doc(db, "orders", `order_${Date.now()}`);
      await setDoc(docRef, {
        storeId: storeId,
        table: Number(table),
        customer: user,
        timeStamp: Date.now(),
        order: cart,
        orderStatus: "new",
      });

      message.success("Order placed successfully");
      setTimeout(() => {
        dispatch(clearCart());
      }, 1000);
      setLoading(false);
    } catch (error) {
      console.error("Error placing order", error);
      message.error("Error placing order");
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = await result.user;
      const userRef = await doc(db, "customer", `customer_${Date.now()}`);

      const userData = {
        storeUser: storeId,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
      };

      await setDoc(userRef, userData);

      localStorage.setItem("token", result.user.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));

      placeOrder();

      return user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSignIn = async () => {
    const user = await signInWithGoogle();
    if (user) {
      console.log("User signed in:", user);
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
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "20px 16px",
      borderBottom: "1px solid #2B3041",
    },
    backBtn: {
      background: "none",
      border: "none",
      color: "white",
      fontSize: "18px",
      cursor: "pointer",
      padding: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: "white",
      fontSize: "18px",
      fontWeight: "600",
      margin: 0,
    },
    headerSubtitle: {
      color: "#9CA3AF",
      fontSize: "14px",
      marginLeft: "auto",
    },
    ordersBtn: {
      background: "none",
      border: "none",
      color: "white",
      fontSize: "20px",
      cursor: "pointer",
      padding: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: "8px",
    },
    content: {
      flex: 1,
      padding: "16px",
      overflowY: "auto",
    },
    itemCard: {
      backgroundColor: "#2B3041",
      borderRadius: "16px",
      padding: "16px",
      marginBottom: "12px",
      display: "flex",
      gap: "12px",
    },
    itemThumb: {
      width: "80px",
      height: "80px",
      borderRadius: "12px",
      objectFit: "cover",
      backgroundColor: "#3B4256",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    itemInfo: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    itemName: {
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
      marginBottom: "4px",
    },
    itemPrice: {
      color: "#EF4444",
      fontSize: "18px",
      fontWeight: "700",
    },
    controlsRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: "12px",
    },
    qtyControl: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "#3B4256",
      borderRadius: "8px",
      overflow: "hidden",
    },
    qtyBtn: {
      width: "36px",
      height: "36px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
    },
    qtyValue: {
      width: "36px",
      textAlign: "center",
      color: "white",
      fontSize: "16px",
      fontWeight: "600",
    },
    deleteBtn: {
      width: "40px",
      height: "40px",
      backgroundColor: "rgba(239, 68, 68, 0.15)",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      cursor: "pointer",
      color: "#EF4444",
      fontSize: "18px",
    },
    footer: {
      padding: "20px 16px",
      borderTop: "1px solid #2B3041",
      backgroundColor: "#1E2433",
    },
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    totalLabel: {
      color: "#9CA3AF",
      fontSize: "16px",
    },
    totalValue: {
      color: "#F59E0B",
      fontSize: "28px",
      fontWeight: "700",
    },
    placeOrderBtn: {
      width: "100%",
      height: "56px",
      backgroundColor: "#F59E0B",
      border: "none",
      borderRadius: "12px",
      color: "#1E2433",
      fontSize: "18px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    googleBtnWrapper: {
      display: "flex",
      justifyContent: "center",
    },
  };

  return (
    <AppLayout>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <LeftOutlined />
          </button>
          <h1 style={styles.headerTitle}>Your Requests</h1>
          <span style={styles.headerSubtitle}>{cartTotalCount} items</span>
          <button
            style={styles.ordersBtn}
            onClick={() => navigate(`/orders/${storeId}/${table}`)}
            title="Order History"
          >
            <HistoryOutlined />
          </button>
        </div>

        {/* Cart Items */}
        <div style={styles.content}>
          {cart.map((item, index) => (
            <div style={styles.itemCard} key={index}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} style={styles.itemThumb} />
              ) : (
                <div style={styles.itemThumb}>
                  <span style={{ fontSize: "28px" }}>🥘</span>
                </div>
              )}

              <div style={styles.itemInfo}>
                <div>
                  <div style={styles.itemName}>{item.name}</div>
                  <div style={styles.itemPrice}>₹{item.price * item.quantity}</div>
                </div>

                <div style={styles.controlsRow}>
                  <div style={styles.qtyControl}>
                    <button
                      style={styles.qtyBtn}
                      onClick={() => dispatch(decrementQuantity(item.name))}
                    >
                      <MinusOutlined />
                    </button>
                    <span style={styles.qtyValue}>{item.quantity}</span>
                    <button
                      style={styles.qtyBtn}
                      onClick={() => dispatch(incrementQuantity(item.name))}
                    >
                      <PlusOutlined />
                    </button>
                  </div>

                  <button
                    style={styles.deleteBtn}
                    onClick={() => dispatch(removeFromCart(item.name))}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total</span>
            <span style={styles.totalValue}>₹{cartTotal.toFixed(2)}</span>
          </div>

          {!user ? (
            <div style={styles.googleBtnWrapper}>
              <GoogleButton
                label="Login to place your order"
                onClick={() => handleSignIn()}
                style={{ borderRadius: "12px", overflow: "hidden", width: "100%" }}
              />
            </div>
          ) : (
            <Button
              loading={loading}
              onClick={placeOrder}
              style={{
                ...styles.placeOrderBtn,
                opacity: loading ? 0.7 : 1,
              }}
            >
              Place Order
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ReviewMenu;
