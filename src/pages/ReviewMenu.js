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
 
} from "../actions/cartActions";
import {
    LeftCircleOutlined,
} from "@ant-design/icons";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { db } from "../firebase/setup";
import { useNavigate, useParams } from "react-router-dom";
import { DOMContentLoaded, renderIngridents } from "../constants/commonFunctions";
import { BiDish } from "react-icons/bi";
import { MdOutlineTimer } from "react-icons/md";
import { GiCampCookingPot } from "react-icons/gi";
import CartActionButtons from "../components/CartActionButtons";
import { setPageLoading } from "../actions/storeActions";
import AppLayout from "./AppLayout";

const ReviewMenu = () => {
  const cart = useSelector((state) => state.cartReducer.cart);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  let user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (cart.length == 0) {
      dispatch(setPageLoading({payload:true}))
      navigate(-1);
    }
  }, [cart]);

  const { storeId } = useParams();
  const { table } = useParams();
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
      await setDoc(docRef, {
        storeId: storeId,
        table:Number(table),
        customer: user,
        timeStamp: Date.now(),
        order: cart,
        orderStatus:'new'
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
    <AppLayout>
       <div
      id="myElement"
      style={{
        padding: "10px",
        backgroundColor: storeDetails?.primaryColor,
        height: "90vh",
        overflow:'auto'
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
          <div style={{padding:'10px 5px', display: "flex", flexDirection: "row", gap: "10px",justifyContent:'space-between',  borderBottom:`1px solid ${storeDetails?.secondaryColor}`}}>
            <div style={{ display: "flex", gap: "20px", width:'74%' }}>
            {item?.imageUrl&&(

<img
src={item.imageUrl}
style={{ width: "60px", borderRadius: "5px", height: "fit-content" }}
/>
)}
              <span style={{ display: "flex", flexDirection: "column", gap:'5px' }}>
                <span>{item.name}</span>
                <span className="menu-item-description smallFont">{item.description}</span>
                <div style={{display:'flex', gap:'10px'}}>
                <span className="smallFont" style={{  display:'flex', alignItems:'center', gap:'2px' }} > <BiDish /> {item.servings}</span>
          <span className="smallFont"  style={{ display:'flex', alignItems:'center',gap:'2px'  }}><MdOutlineTimer />{item.prep_time} mins</span>
          </div>
          <span className="smallFont" style={{ display:'flex', alignItems:'center', gap:'2px' }}>
          <GiCampCookingPot />{renderIngridents(item.ingridents)}
          </span>
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
             
             <CartActionButtons item={item} />
            </div>
          </div>
        ))}
        <span
          style={{
            marginLeft: "auto",
            // borderTop: `1px solid ${storeDetails?.secondaryColor}`,
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
    </AppLayout>
   
  );
};

export default ReviewMenu;
