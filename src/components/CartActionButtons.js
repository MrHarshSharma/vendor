import React from 'react'

import {
    decrementQuantity,
    incrementQuantity,
    removeFromCart,
  } from "../actions/cartActions";
  import {
    PlusCircleOutlined,
    MinusCircleOutlined,
    DeleteOutlined,

  } from "@ant-design/icons";
import { useDispatch } from 'react-redux';

const CartActionButtons = ({item}) => {
    const dispatch = useDispatch()
  return (
    <div style={{ display: "flex", gap: "10px", flexDirection:'column', justifyContent:'end' }}>
    <div style={{display: "flex", gap: "5px", flexDirection:'row', alignItems:'center'}}>
    {item.quantity > 1 && (
      <span  onClick={() => dispatch(decrementQuantity(item.name))}>
      <MinusCircleOutlined className='smallFont' />
      </span>
      )}
      <span className='smallFont'>
        {item.quantity}
      </span>
      <span onClick={() => dispatch(incrementQuantity(item.name))}>
      <PlusCircleOutlined className='smallFont' />
      </span>
      </div>

      <div >
      
      <span className='smallFont' style={{display:'flex', alignItems:'center', gap:'5px'}} onClick={() => dispatch(removeFromCart(item.name))}>
      <DeleteOutlined className='smallFont' />
      Remove
      </span>
      </div>
    </div>
  )
}

export default CartActionButtons