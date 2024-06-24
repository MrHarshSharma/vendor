// src/store.js
import { createStore, combineReducers } from 'redux';
import { cartReducer } from './reducers/cartReducers';
import { storeReducer } from './reducers/storeReducers';

const rootReducer = combineReducers({
     cartReducer,
     storeReducer
  });

const store = createStore(rootReducer,window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());

export default store;
