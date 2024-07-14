// src/store.js
import { createStore, combineReducers } from 'redux';
import { cartReducer } from './reducers/cartReducers';
import { loadingReducer, storeReducer } from './reducers/storeReducers';

const rootReducer = combineReducers({
     cartReducer,
     storeReducer,
     loadingReducer
  });

const store = createStore(rootReducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

export default store;
