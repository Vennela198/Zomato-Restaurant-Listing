import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './components/MainPage';
import RestaurantDetailPage from './components/RestaurantDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/restaurant-detail" element={<RestaurantDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;