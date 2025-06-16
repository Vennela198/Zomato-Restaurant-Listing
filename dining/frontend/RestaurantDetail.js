import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles_rd.css';

const RestaurantDetailPage = () => {
  const [restaurant, setRestaurant] = useState(null);
  const restaurantId = new URLSearchParams(window.location.search).get('id');

  useEffect(() => {
    if (restaurantId) {
      axios.get(`http://localhost:5001/restaurants/${restaurantId}`)
        .then(response => {
          setRestaurant(response.data);
        })
        .catch(error => {
          console.error('There was an error fetching the restaurant details!', error);
        });
    }
  }, [restaurantId]);

  if (!restaurant) {
    return <p>Loading...</p>;
  }

  return (
    <div className='container'>
      <h1 style={{backgroundColor: '#D3C5E5', fontStyle: 'italic', fontSize: '60px', color: '#01010'}}>Restaurant Details</h1><br></br>
      {/* <p className='x'><b>ID:</b> {restaurant.restaurant_id}</p> */}
      <p className='x'><b><i>Name of the Restaurant: </i> </b>{restaurant.restaurant_name}</p>
      <p className='x'><b><i>Cuisines: </i> </b> {restaurant.cuisines}</p>
      <p className='x'><b><i>City: </i> </b> {restaurant.city}</p>
      <p className='x'><b><i>Cuisines: </i> </b> {restaurant.cuisines}</p>
      <p className='x'><b><i>Price Range: </i> </b> {restaurant.price_range}</p>
      
      <p className='x'><b><i>Rating: </i> </b> {restaurant.aggregate_rating}</p>
      <p className='x'><b><i>Address: </i> </b> {restaurant.address}</p>
      {/* Add more fields as needed */}
    </div>
  );
};

export default RestaurantDetailPage;