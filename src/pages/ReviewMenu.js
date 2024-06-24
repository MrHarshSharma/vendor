import { Button, message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import GoogleButton from "react-google-button";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from "firebase/auth";
import { provider, db, auth } from "../firebase/setup";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { LiaRupeeSignSolid } from "react-icons/lia";

import {
  clearCart,
  decrementQuantity,
  incrementQuantity,
  removeFromCart,
} from "../actions/cartActions";
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
  LeftCircleOutlined,
} from "@ant-design/icons";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { db } from "../firebase/setup";
import { useNavigate, useParams } from "react-router-dom";
import { DOMContentLoaded } from "../constants/commonFunctions";
import MenuItem from "../components/MenuItem";
const ReviewMenu = () => {
  const cart = useSelector((state) => state.cartReducer.cart);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  let user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (cart.length == 0) {
      navigate(-1);
    }
  }, [cart]);

  const { storeId } = useParams();
  const [storeDetails, setStoreDetails] = useState(null);
  const fetchConfigstore = async () => {
    try {
      const configRef = doc(db, "configstore", storeId);
      const docSnap = await getDoc(configRef);

      if (docSnap.exists()) {
        console.log("this user data", docSnap.data());
        setStoreDetails(docSnap.data());
      } else {
        console.log("No such document!");
        // return null;
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    }
  };

  useEffect(() => {
    fetchConfigstore();
  }, []);

  useEffect(() => {
    if (storeDetails !== null) {
      // setTimeout(()=>{
      DOMContentLoaded(storeDetails.primaryColor);
      // },1000)
    }
  }, [storeDetails]);

  const placeOrder = async () => {
    let user = JSON.parse(localStorage.getItem("user"));
    setLoading(true);
    try {
      const docRef = doc(db, "orders", `order_${Date.now()}`);
      //   const docSnap = await getDoc(docRef);
      //     let menu = 'menu'
      //     console.log(docSnap.data());
      //   if (docSnap.exists()) {
      //     // Update the document if it exists
      //     await updateDoc(docRef, {
      //       [menu]: categories,
      //     });
      //   } else {
      // Create the document with the specified field if it doesn't exist
      await setDoc(docRef, {
        storeId: storeId,
        customer: user,
        timeStamp: Date.now(),
        order: cart,
      });
      //   }

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

      // const docSnap = await getDoc(userRef);

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
      console.log("User signed in:", user);
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

  return (
    <div
      id="myElement"
      style={{
        padding: "10px",
        backgroundColor: storeDetails?.primaryColor,
        height: "100vh",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <span style={{ marginRight: "10px" }} onClick={() => navigate(-1)}>
          <LeftCircleOutlined />
        </span>
        View and confirm order
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {cart.map((item, i) => (
          <div style={{display: "flex", flexDirection: "row", gap: "10px",justifyContent:'space-between'}}>
            <div style={{ display: "flex", gap: "20px" }}>
              <img
                src={item.imageUrl}
                style={{ width: "60px", borderRadius: "5px" }}
              />
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span>{item.name}</span>
                <span>{item.description}</span>
                <span style={{display:'flex', alignItems:'center'}}><LiaRupeeSignSolid/>{item.quantity * item.price}</span>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
             
              <div style={{ display: "flex", gap: "10px", flexDirection:'column', justifyContent:'end' }}>
              <div style={{display: "flex", gap: "5px", flexDirection:'row'}}>
              {item.quantity > 1 && (
                <span onClick={() => dispatch(decrementQuantity(item.name))}>
                <MinusCircleOutlined />
                </span>
                )}
                <span>
                Qty: {item.quantity}
                </span>
                <span onClick={() => dispatch(incrementQuantity(item.name))}>
                <PlusCircleOutlined />
                </span>
                </div>

                <div>
                
                <span style={{display:'flex', alignItems:'center', gap:'5px'}} onClick={() => dispatch(removeFromCart(item.name))}>
                <DeleteOutlined />
                Remove
                </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <span
          style={{
            marginLeft: "auto",
            borderTop: `1px solid ${storeDetails?.secondaryColor}`,
            display:'flex',
            alignItems: 'center',
          }}
        >
          Total is{" "}
          <LiaRupeeSignSolid />
          {cart.reduce((total, item) => total + item.price * item.quantity, 0)}{" "}
           only
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          {!user ? (
            <GoogleButton
              label="Login to place your order"
              onClick={() => handleSignIn()}
              style={{ overFlow: "hidden", borderRadius: "5px" }}
            />
          ) : (
            <Button
              loading={loading}
              onClick={placeOrder}
              style={{
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: "20px",
                backgroundColor: storeDetails?.secondaryColor,
                padding: "5px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                boxShadow: "0px 0px 7px -2px #000",
              }}
            >
              Confirm and place order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewMenu;
