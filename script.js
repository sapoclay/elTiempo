import obfuscatedKey from './config.js';

const reverseString = (str) => {
    return str.split('').reverse().join('');
};
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");

// Obtener la API key 
const API_KEY = reverseString(obfuscatedKey);

//Función para crear la tarjeta del clima del día de hoy y la predicción a 5 días
const createWeatherCard = (cityName, weatherItem, index) => {
    const { dt_txt, main, wind, weather } = weatherItem;
    const date = new Date(dt_txt);
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`; // Cambiamos el formato de fecha devuelta por la API
    const temperature = (main.temp - 273.15).toFixed(0);



    const traducirDescripcionClima = (descripcion) => {
        switch (descripcion) { // Traducción de la descripción que devuelve la API
            case 'clear sky':
                return 'Cielo despejado';
            case 'few clouds':
                return 'Algunas nubes';
            case 'overcast clouds':
                return 'Nublado';
            case 'drizzle':
                return 'Llovizna';
            case 'broken clouds':
                return 'Algunas nubes';
            case 'scattered clouds':
                return 'Nubes dispersas';
            case 'rain':
                return 'Lluvia';
            case 'light rain':
                return 'Lluvia ligera';
            case 'moderate rain':
                return 'Lluvia moderada';
            case 'shower rain':
                return 'Lluvia intensa';
            case 'thunderstorm':
                return 'Tormenta';
            case 'snow':
                return 'Nieve';
            case 'light snow':
                return 'Nieve ligera';
            case 'mist':
                return 'Niebla';
            default:
                return descripcion; // Devuelve la descripción original si no se encuentra una traducción
        }
    };

    if (index === 0) { // Muestra los datos del clima para el día de hoy
        return `<div class="details">
                    <h2>Clima en ${cityName} a ${formattedDate}</h2>
                    <h6>Temperatura: ${temperature}°C</h6>
                    <h6>Viento: ${wind.speed} M/S</h6>
                    <h6>Humedad: ${main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${traducirDescripcionClima(weather[0].description)}</h6>
                </div>`;
    } else { // Muestra los datos para la predicción de los cinco días
        return `<li class="card"> 
                    <h3>${cityName} el ${formattedDate}</h3>
                    <img src="https://openweathermap.org/img/wn/${weather[0].icon}.png" alt="weather-icon">
                    <h6>Predicción: ${traducirDescripcionClima(weather[0].description)}</h6>
                    <h6>Temperatura: ${temperature}°C</h6>
                    <h6>Viento: ${wind.speed} M/S</h6>
                    <h6>Humedad: ${main.humidity}%</h6>
                </li>`;
    }
};

// Función para obtener detalles de la API
const getWeatherDetails = async (cityName, latitude, longitude) => {
    try {
        const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
        const response = await fetch(WEATHER_API_URL);
        const data = await response.json();

        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            index === 0 ? currentWeatherDiv.insertAdjacentHTML("beforeend", html) : weatherCardsDiv.insertAdjacentHTML("beforeend", html);
        });
    } catch (error) {
        console.error("Error al obtener los detalles del clima. ", error);
        alert("Ocurrió un error al obtener el pronóstico del tiempo.");
        hideWeatherData(); // Oculta la sección de datos climáticos en caso de error
    }
};

const getCityCoordinates = async () => {
    const cityName = cityInput.value.trim();
    if (!cityName){
        hideWeatherData();
        alert("Por favor, escribe el nombre de una ciudad.");
        return; // Utiliza 'return' en lugar de 'exit' para salir de la función
    }
    try {
        const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data.length){
            hideWeatherData();
            alert(`No se encontraron coordenadas para ${cityName}`);
            return; // Utiliza 'return' para salir de la función
        }
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
        
    } catch (error) {
        console.error("Error al obtener las coordenadas de la ciudad:", error);
        alert("Ocurrió un error al obtener las coordenadas.");
        hideWeatherData(); // Oculta la sección de datos climáticos en caso de error
    }
};

// Función para obtener los datos del clima cuando el usuario utiliza su ubicación actual
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

            fetch(API_URL)
                .then(response => response.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(error => {
                    console.error("Error al obtener el nombre de la ciudad. ", error);
                    alert("Ocurrió un error al obtener el nombre de la ciudad.");
                    hideWeatherData(); // Oculta la sección de datos climáticos en caso de error
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Solicitud de geolocalización denegada. Restablece el permiso de ubicación para otorgar acceso nuevamente.");
                hideWeatherData(); // Oculta la sección de datos climáticos en caso de error
            } else {
                alert("Error de solicitud de geolocalización. Restablece el permiso de ubicación.");
                hideWeatherData(); // Oculta la sección de datos climáticos en caso de error
            }
        }
    );
};

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

cityInput.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        showWeatherData(); // Mostrar la sección de datos climáticos al presionar Enter
    }
});

searchButton.addEventListener("click", function() {
    showWeatherData(); // Mostrar la sección de datos climáticos al hacer clic en el botón de búsqueda
});

locationButton.addEventListener("click", function() {
    showWeatherData(); // Mostrar la sección de datos climáticos al hacer clic en el botón de ubicación
});

const showWeatherData = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) {
        hideWeatherData(); // Ocultar la sección de datos climáticos si no se proporciona un nombre de ciudad
        return; // Utiliza 'return' para salir de la función después de ocultar los datos climáticos
    }
    // Mostrar la sección de datos climáticos si se proporciona un nombre de ciudad
    document.querySelector('.weather-data').classList.remove('hidden');
};

const hideWeatherData = () => {
    document.querySelector('.weather-data').classList.add('hidden');
};