import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles_rl.css';

const MainPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchId, setSearchId] = useState('');
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [Latitude, setLatitude] = useState('');
  const [Longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null); // State to store the uploaded file
  const [text, setText] = useState('');


  useEffect(() => {
    if (!searchId && !Latitude && !Longitude && !radius) {
      fetchRestaurants();
    }
  }, [currentPage, searchId, Latitude, Longitude, radius]);

  const fetchRestaurants = () => {
    setLoading(true);
    axios.get(`http://localhost:5001/restaurants?page=${currentPage}&limit=18`) // Ensure the limit value is correct here
      .then(response => {
        setRestaurants(response.data.restaurants);
        setTotalPages(response.data.totalPages);
      })
      .catch(error => {
        console.error('There was an error fetching the restaurants data!', error);
      })
      .finally(() => setLoading(false));
  };

  const handleSearchById = () => {
    if (searchId) {
      setLoading(true);
      axios.get(`http://localhost:5001/restaurants/${searchId}`)
        .then(response => {
          setRestaurants([response.data]);
          setRestaurantDetails(null);
        })
        .catch(error => {
          console.error('There was an error fetching the restaurant details!', error);
          setRestaurantDetails(null);
        })
        .finally(() => setLoading(false));
    }
  };

  const handleText = () => {
    if(text){
      setLoading(true);
    axios.get(`http://localhost:5001/restaurants/cuisines/${text}?page=${currentPage}&limit=10`)  // Ensure the limit value is correct
      .then(response => {
        setRestaurants(response.data.restaurants);
        setTotalPages(response.data.totalPages);  // Update total pages from response
        setRestaurantDetails(null);
      })
      .catch(error => {
        console.log('Error fetching data:', error);
        setRestaurants([]);
      })
      .finally(() => setLoading(false));
  }
};
  const handleSearchByLocation = () => {
    if (Latitude && Longitude && radius) {
      setLoading(true);
      axios.get(`http://localhost:5001/restaurants/location/${Latitude}/${Longitude}/${radius}`)
        .then(response => {
          setRestaurants(response.data);
          setRestaurantDetails(null);
        })
        .catch(error => {
          console.log('Error fetching data:', error);
          setRestaurants([]);
        })
        .finally(() => setLoading(false));
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append('foodImage', file);

    setLoading(true);
    axios.post('http://localhost:5001/restaurants/analyze-image', formData)
      .then(response => {
        alert('Image processed successfully. Check console for details.');
        console.log(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error uploading image:', error);
        setLoading(false);
      });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleRestaurantClick = (restaurantId) => {
    window.location.href = `/restaurant-detail?id=${restaurantId}`;
  };

  return (
    <div className="container">
      <i><h1 style={{textAlign: 'center', fontSize: '50px', color:'#44195e'}}>Zomato Restaurant Listing</h1></i>
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Enter Restaurant ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button onClick={handleSearchById} className='b1'>Search by ID</button>
        </div>
        <div className='cuisine-search-bar'>
          <input
            type="text"
            placeholder="Enter Cuisine"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button onClick={handleText} className='b2'>Search by Cuisine</button>

        </div>
        <div className='upload-section'>
            <input type="file" onChange={handleFileChange} />
            
           
            <button onClick={handleFileUpload} disabled={!file || loading} className='b2'>
              {loading ? 'Processing...' : 'Search by Image'}
            </button>
            
          </div>
        <div className="location-search">
          <input
            type="text"
            placeholder="Enter Latitude"
            value={Latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Longitude"
            value={Longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter Radius (in km)"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
          <button onClick={handleSearchByLocation} className='b2'>Search by Location</button>
          
        </div>
      </div>
      {loading ? <p>Loading...</p> : (
        <>
          {restaurantDetails ? (
            <div className="restaurant-details">
              <h2>Restaurant Details</h2>
              <p>ID: {restaurantDetails.restaurant_id}</p>
              <p>Name: {restaurantDetails.restaurant_name}</p>
              <p>Cuisines: {restaurantDetails.cuisines}</p>
              <p>Address: {restaurantDetails.address}</p>
            </div>
          ) : (
            <div className="restaurant-list">
              {restaurants.length > 0 ? (
                restaurants.map(restaurant => (
                  <div key={restaurant.restaurant_id} className="restaurant-box" onClick={() => handleRestaurantClick(restaurant.restaurant_id)}>
                    <p><b> {restaurant.restaurant_name}</b></p>
                    <p>{restaurant.cuisines}</p>
                  </div>
                ))
              ) : (
                <p>No restaurants found for the search criteria.</p>
              )}
            </div>
          )}
          {!searchId && !Latitude && !Longitude && !radius && (
            <div className="pagination">
              <button onClick={handlePreviousPage} disabled={currentPage === 1} className='b2'>Previous</button>
              <button onClick={handleNextPage} disabled={currentPage === totalPages} className='b2'>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MainPage;