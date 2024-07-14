// src/reducers/cartReducer.js
import { ADD_STORE } from "../actions/storeActions";
import { LOADING } from "../actions/storeActions";

const initialState = {
  store: [],
};

const initialState_loading = {
  loading:true
}


export const storeReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_STORE:
      return {
        ...state,
        store: action.payload,
      };

    default:
      return state;
  }
};


export const loadingReducer = (state = initialState_loading, action) => {
  switch (action.type) {
    case LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};