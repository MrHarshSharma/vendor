import React, { useEffect } from "react";
import { addToCart, decrementQuantity, incrementQuantity, removeFromCart } from "../actions/cartActions";
import { useDispatch, useSelector } from "react-redux";
import {message} from 'antd'
import { LiaRupeeSignSolid } from "react-icons/lia";
import { hexToRgba, renderIngridents } from "../constants/commonFunctions";
import { BiDish } from "react-icons/bi";
import { MdOutlineTimer } from "react-icons/md";
import { GiCampCookingPot } from "react-icons/gi";
import {
  PlusCircleOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
  LeftCircleOutlined,
} from "@ant-design/icons";
import { BiFoodTag } from "react-icons/bi";
import CartActionButtons from "./CartActionButtons";

const MenuItem = ({ item, inCart, storeDetails }) => {
const dispatch = useDispatch();
    const handleAddToCart = (item) => {
        dispatch(addToCart(item));
      };
      const cart = useSelector(state => state.cartReducer.cart);
      useEffect(() =>{
        console.log(cart)
      },[])
     const renderTheButtonAction = (itemName) =>{
   
      let isPresent = cart.filter(cartItem=>cartItem.name === itemName)[0];
      if(isPresent){
        return (
              <CartActionButtons item={isPresent} />
        )
      }else{
        return (   <span
          onClick={() => {
            handleAddToCart(item);
            // message.success(`${item.name} added to cart`);
          }}
          style={{
            backgroundColor: hexToRgba(storeDetails?.secondaryColor),
            padding: "2px 5px",
            borderRadius: "5px",
          }}
        >
        Add
        </span>)
      }
     }

  return (
    <div className="item-menu" style={{flex:1}}>
      
      <div key={item.name} className="menu-item">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "-webkit-fill-available",
            gap:'5px'
          }}
        >
        
          <span style={{ color: storeDetails?.primaryColor, display:'flex', gap:'5px', alignItems:'center' }}><BiFoodTag style={{color:item.veg_nonveg=='veg'?'green':'red'}} />{item.name}</span>
       
          <span
          style={{ color: storeDetails?.primaryColor }}
          className="menu-item-description smallFont"
          >
          {item.description}
          </span>
          <div style={{display:'flex', gap:'10px'}}>
          <span className="smallFont" style={{ color: storeDetails?.primaryColor, display:'flex', alignItems:'center', gap:'2px' }} > <BiDish /> {item.servings}</span>
          <span className="smallFont"  style={{ color: storeDetails?.primaryColor,  display:'flex', alignItems:'center',gap:'2px'  }}><MdOutlineTimer />{item.prep_time} mins</span>
          </div>
          <span className="smallFont" style={{ color: storeDetails?.primaryColor,  display:'flex', alignItems:'center', gap:'2px' }}>
          <GiCampCookingPot />{renderIngridents(item.ingridents)}
          </span>
         
          <div
            style={{
              marginTop: "auto",
              gap: "5px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              
            }}
          >
            <span
              style={{
                color: storeDetails?.primaryColor,
                display: "flex",
                alignItems: "center",
              }}
            >
              <LiaRupeeSignSolid />
              {item.price}
            </span>
            
           
          </div>
        </div>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:'10px', alignItems:'center', justifyContent:'center'}}>
{item?.imageUrl && (
  <img
          src={item.imageUrl}
          style={{
            width: "70px",
            borderRadius: "5px",
          }}
        />
)}
      
        {!inCart && ( 
          <>
          {renderTheButtonAction(item.name)}
          </>   
        )}
      </div>

    </div>
  );
};

export default MenuItem;
